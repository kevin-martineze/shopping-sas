import type { SupabaseClient } from '@supabase/supabase-js';

import type { CreateOrderResult, Order, OrderStatus, OrderWithItems } from '$lib/domain/orders';
import type { RawCartLine } from '$lib/server/cart';

export interface CreateOrderInput {
	customer: {
		name: string;
		phone: string;
		city?: string | null;
		address?: string | null;
		notes?: string | null;
	};
	shippingZoneId: string | null;
	couponCode: string | null;
	items: RawCartLine[];
}

/**
 * Crea el pedido llamando a la función SQL: es la que bloquea las variantes,
 * revalida stock, recalcula precios y descuenta inventario en una transacción.
 */
/**
 * `create_order` devuelve jsonb: llega sin tipo desde PostgREST, así que se
 * lee campo a campo en lugar de castear.
 */
function readOrderResult(value: unknown): CreateOrderResult {
	if (typeof value !== 'object' || value === null) return { ok: false, error: 'unknown' };

	const record: Record<string, unknown> = { ...value };

	if (record.ok !== true) {
		return {
			ok: false,
			error: typeof record.error === 'string' ? record.error : 'unknown',
			reason: typeof record.reason === 'string' ? record.reason : undefined,
			items: Array.isArray(record.items) ? readStockProblems(record.items) : undefined
		};
	}

	return {
		ok: true,
		id: typeof record.id === 'string' ? record.id : undefined,
		number: typeof record.number === 'number' ? record.number : undefined,
		token: typeof record.token === 'string' ? record.token : undefined
	};
}

function readStockProblems(items: unknown[]): NonNullable<CreateOrderResult['items']> {
	const problems: NonNullable<CreateOrderResult['items']> = [];

	for (const item of items) {
		if (typeof item !== 'object' || item === null) continue;

		const record: Record<string, unknown> = { ...item };

		problems.push({
			variant_id: typeof record.variant_id === 'string' ? record.variant_id : '',
			requested: typeof record.requested === 'number' ? record.requested : 0,
			available: typeof record.available === 'number' ? record.available : 0,
			product: typeof record.product === 'string' ? record.product : '',
			color: typeof record.color === 'string' ? record.color : '',
			size: typeof record.size === 'string' ? record.size : ''
		});
	}

	return problems;
}

export async function createOrder(
	supabase: SupabaseClient,
	input: CreateOrderInput
): Promise<CreateOrderResult> {
	const { data, error } = await supabase.rpc('create_order', {
		p_payload: {
			customer: {
				name: input.customer.name,
				phone: input.customer.phone,
				city: input.customer.city ?? null,
				address: input.customer.address ?? null,
				notes: input.customer.notes ?? null
			},
			shipping_zone_id: input.shippingZoneId,
			coupon_code: input.couponCode,
			items: input.items.map((line) => ({ variant_id: line.variantId, qty: line.qty }))
		}
	});

	if (error) throw error;

	return readOrderResult(data);
}

const ORDER_SELECT = `
	id, number, public_token, status, customer_name, customer_phone, customer_city, customer_address,
	customer_notes, shipping_zone_id, shipping_zone_name, shipping_cost, coupon_code,
	subtotal, discount, total, whatsapp_opened_at, admin_notes, created_at,
	order_items ( id, variant_id, product_id, product_name, product_slug, color_name, size_label, sku, unit_price, qty, line_total )
`;

interface OrderRow extends Order {
	order_items: OrderWithItems['items'];
}

function toOrder(row: OrderRow): OrderWithItems {
	const { order_items, ...order } = row;
	return { ...order, items: order_items };
}

export async function getOrderByNumber(
	supabase: SupabaseClient,
	orderNumber: number
): Promise<OrderWithItems | null> {
	const { data, error } = await supabase
		.from('orders')
		.select(ORDER_SELECT)
		.eq('number', orderNumber)
		.maybeSingle<OrderRow>();

	if (error) throw error;
	return data ? toOrder(data) : null;
}

export async function getOrderById(
	supabase: SupabaseClient,
	id: string
): Promise<OrderWithItems | null> {
	const { data, error } = await supabase
		.from('orders')
		.select(ORDER_SELECT)
		.eq('id', id)
		.maybeSingle<OrderRow>();

	if (error) throw error;
	return data ? toOrder(data) : null;
}

export interface OrderListFilters {
	status: OrderStatus | null;
	q: string | null;
	page: number;
}

export const ORDERS_PER_PAGE = 20;

export async function listOrders(
	supabase: SupabaseClient,
	filters: OrderListFilters
): Promise<{ orders: Order[]; total: number; pageCount: number }> {
	let query = supabase
		.from('orders')
		.select(
			`id, number, public_token, status, customer_name, customer_phone, customer_city, customer_address,
			customer_notes, shipping_zone_id, shipping_zone_name, shipping_cost, coupon_code,
			subtotal, discount, total, whatsapp_opened_at, admin_notes, created_at`,
			{ count: 'exact' }
		)
		.order('created_at', { ascending: false });

	if (filters.status) query = query.eq('status', filters.status);

	if (filters.q) {
		const numeric = Number(filters.q.replace('#', ''));

		query =
			Number.isFinite(numeric) && numeric > 0
				? query.eq('number', numeric)
				: query.ilike('customer_name', `%${filters.q}%`);
	}

	const from = (filters.page - 1) * ORDERS_PER_PAGE;
	const { data, error, count } = await query
		.range(from, from + ORDERS_PER_PAGE - 1)
		.returns<Order[]>();

	if (error) throw error;

	const total = count ?? 0;

	return {
		orders: data ?? [],
		total,
		pageCount: Math.max(1, Math.ceil(total / ORDERS_PER_PAGE))
	};
}

export async function setOrderStatus(
	supabase: SupabaseClient,
	id: string,
	status: OrderStatus
): Promise<void> {
	// Cancelar devuelve stock y libera el uso del cupón: lo hace la función SQL.
	if (status === 'cancelled') {
		const { error } = await supabase.rpc('cancel_order', { p_order_id: id });
		if (error) throw error;
		return;
	}

	const { error } = await supabase.from('orders').update({ status }).eq('id', id);
	if (error) throw error;
}

export async function markWhatsAppOpened(
	supabase: SupabaseClient,
	orderNumber: number
): Promise<void> {
	const { error } = await supabase.rpc('mark_whatsapp_opened', { p_number: orderNumber });
	if (error) throw error;
}
