import type { Order, OrderItem, OrderStatus, OrderWithItems } from '$lib/domain/orders';
import type { Coupon, ShippingZone } from '$lib/domain/settings';
import type { CouponInput } from '$lib/schemas/admin';
import type { ApiResult } from '$lib/server/api/client';
import type { PanelContext } from '$lib/server/context';

import { z } from 'zod';

import { panelRequest, segment } from '$lib/server/api/request';
import { orderStatusSchema, toApiOrderStatus } from '$lib/server/api/statuses';

/** Comercio del panel: pedidos, resumen, cupones, zonas de envío y avisos de reposición. */

// ---------------------------------------------------------------------------
// Pedidos
// ---------------------------------------------------------------------------

const orderShape = {
	id: z.string(),
	number: z.number(),
	publicToken: z.string(),
	status: orderStatusSchema,
	customerName: z.string(),
	customerPhone: z.string(),
	customerCity: z.string().nullable(),
	customerAddress: z.string().nullable(),
	customerNotes: z.string().nullable(),
	shippingZoneId: z.string().nullable(),
	shippingZoneName: z.string().nullable(),
	shippingCost: z.number(),
	couponCode: z.string().nullable(),
	subtotal: z.number(),
	discount: z.number(),
	total: z.number(),
	whatsappOpenedAt: z.string().nullable(),
	adminNotes: z.string().nullable(),
	createdAt: z.string()
};

function toOrder(order: z.output<z.ZodObject<typeof orderShape>>): Order {
	return {
		id: order.id,
		number: order.number,
		public_token: order.publicToken,
		status: order.status,
		customer_name: order.customerName,
		customer_phone: order.customerPhone,
		customer_city: order.customerCity,
		customer_address: order.customerAddress,
		customer_notes: order.customerNotes,
		shipping_zone_id: order.shippingZoneId,
		shipping_zone_name: order.shippingZoneName,
		shipping_cost: order.shippingCost,
		coupon_code: order.couponCode,
		subtotal: order.subtotal,
		discount: order.discount,
		total: order.total,
		whatsapp_opened_at: order.whatsappOpenedAt,
		admin_notes: order.adminNotes,
		created_at: order.createdAt
	};
}

const orderItemSchema = z
	.object({
		id: z.string(),
		variantId: z.string().nullable(),
		productId: z.string().nullable(),
		productName: z.string(),
		productSlug: z.string(),
		colorName: z.string(),
		sizeLabel: z.string(),
		sku: z.string().nullable(),
		unitPrice: z.number(),
		qty: z.number(),
		lineTotal: z.number()
	})
	.transform((item): OrderItem => ({
		id: item.id,
		variant_id: item.variantId,
		product_id: item.productId,
		product_name: item.productName,
		product_slug: item.productSlug,
		color_name: item.colorName,
		size_label: item.sizeLabel,
		sku: item.sku,
		unit_price: item.unitPrice,
		qty: item.qty,
		line_total: item.lineTotal
	}));

const orderDetailSchema = z
	.object({ ...orderShape, items: z.array(orderItemSchema) })
	.transform((order): OrderWithItems => ({ ...toOrder(order), items: order.items }));

const orderPageSchema = z.object({
	orders: z.array(z.object(orderShape).transform(toOrder)),
	total: z.number(),
	pageCount: z.number()
});

export interface OrderListFilters {
	status: OrderStatus | null;
	q: string | null;
	page: number;
}

export function listOrders(
	ctx: PanelContext,
	filters: OrderListFilters
): Promise<ApiResult<z.output<typeof orderPageSchema>>> {
	const params = new URLSearchParams({ page: String(Math.min(filters.page, 1000)) });

	if (filters.status) params.set('status', toApiOrderStatus(filters.status));
	if (filters.q) params.set('q', filters.q.slice(0, 80));

	return panelRequest(ctx, `/orders?${params}`, orderPageSchema);
}

export function getOrder(ctx: PanelContext, id: string): Promise<ApiResult<OrderWithItems>> {
	return panelRequest(ctx, `/orders/${segment(id)}`, orderDetailSchema);
}

export function getOrderByNumber(
	ctx: PanelContext,
	orderNumber: number
): Promise<ApiResult<OrderWithItems>> {
	return panelRequest(ctx, `/orders/number/${orderNumber}`, orderDetailSchema);
}

/** Cancelar devuelve stock y cupón, una sola vez; la API no deja reabrir un cancelado. */
export function updateOrder(
	ctx: PanelContext,
	id: string,
	patch: { status?: OrderStatus; adminNotes?: string | null }
): Promise<ApiResult<OrderWithItems>> {
	return panelRequest(ctx, `/orders/${segment(id)}`, orderDetailSchema, {
		method: 'PATCH',
		body: {
			status: patch.status ? toApiOrderStatus(patch.status) : undefined,
			adminNotes: patch.adminNotes
		}
	});
}

// ---------------------------------------------------------------------------
// Resumen
// ---------------------------------------------------------------------------

const dashboardSchema = z
	.object({
		pendingOrders: z.number(),
		stalePendingOrders: z.number(),
		monthRevenue: z.number(),
		monthOrders: z.number(),
		lowStock: z.array(
			z.object({
				variantId: z.string(),
				stock: z.number(),
				productName: z.string(),
				colorName: z.string(),
				sizeLabel: z.string()
			})
		),
		pendingRestock: z.number()
	})
	.transform((dashboard) => ({
		...dashboard,
		lowStock: dashboard.lowStock.map(({ variantId, ...rest }) => ({ id: variantId, ...rest }))
	}));

export type DashboardStats = z.output<typeof dashboardSchema>;

export function getDashboard(ctx: PanelContext): Promise<ApiResult<DashboardStats>> {
	return panelRequest(ctx, '/dashboard', dashboardSchema);
}

// ---------------------------------------------------------------------------
// Cupones
// ---------------------------------------------------------------------------

const couponSchema = z
	.object({
		id: z.string(),
		code: z.string(),
		type: z.enum(['PERCENT', 'FIXED']),
		value: z.number(),
		minSubtotal: z.number(),
		startsAt: z.string().nullable(),
		endsAt: z.string().nullable(),
		maxUses: z.number().nullable(),
		uses: z.number(),
		active: z.boolean(),
		createdAt: z.string()
	})
	.transform((coupon): Coupon => ({
		id: coupon.id,
		code: coupon.code,
		type: coupon.type === 'PERCENT' ? 'percent' : 'fixed',
		value: coupon.value,
		min_subtotal: coupon.minSubtotal,
		starts_at: coupon.startsAt,
		ends_at: coupon.endsAt,
		max_uses: coupon.maxUses,
		uses: coupon.uses,
		active: coupon.active,
		created_at: coupon.createdAt
	}));

/**
 * Fecha de un `<input type="datetime-local">` a ISO con la hora de Colombia.
 *
 * El input no trae zona horaria. Sin agregarla, la API la interpretaría en la
 * hora de su servidor (UTC) y un cupón "hasta la medianoche" vencería a las 7
 * p. m.
 */
export function toBogotaIso(value: string): string | null {
	if (value === '') return null;
	if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return `${value}:00-05:00`;
	if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00-05:00`;

	return value;
}

const resultSchema = z.object({ result: z.enum(['deleted', 'deactivated']) });

export function listCoupons(ctx: PanelContext): Promise<ApiResult<Coupon[]>> {
	return panelRequest(ctx, '/coupons', z.array(couponSchema));
}

export function createCoupon(ctx: PanelContext, input: CouponInput) {
	return panelRequest(ctx, '/coupons', couponSchema, {
		method: 'POST',
		body: {
			code: input.code,
			type: input.type === 'percent' ? 'PERCENT' : 'FIXED',
			value: input.value,
			minSubtotal: input.minSubtotal,
			startsAt: toBogotaIso(input.startsAt),
			endsAt: toBogotaIso(input.endsAt),
			maxUses: input.maxUses ?? null,
			active: input.active
		}
	});
}

export function setCouponActive(ctx: PanelContext, id: string, active: boolean) {
	return panelRequest(ctx, `/coupons/${segment(id)}`, couponSchema, {
		method: 'PATCH',
		body: { active }
	});
}

/** `deactivated`: ya se usó, así que se desactivó para no romper el historial. */
export function removeCoupon(ctx: PanelContext, id: string) {
	return panelRequest(ctx, `/coupons/${segment(id)}`, resultSchema, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Zonas de envío
// ---------------------------------------------------------------------------

const zoneSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		cost: z.number(),
		etaDays: z.number().nullable(),
		active: z.boolean(),
		sortOrder: z.number()
	})
	.transform((zone): ShippingZone => ({
		id: zone.id,
		name: zone.name,
		cost: zone.cost,
		eta_days: zone.etaDays,
		active: zone.active,
		sort_order: zone.sortOrder
	}));

export interface ZoneInput {
	name: string;
	cost: number;
	etaDays: number | null;
	active: boolean;
	sortOrder: number;
}

export function listZones(ctx: PanelContext): Promise<ApiResult<ShippingZone[]>> {
	return panelRequest(ctx, '/shipping-zones', z.array(zoneSchema));
}

export function createZone(ctx: PanelContext, input: ZoneInput) {
	return panelRequest(ctx, '/shipping-zones', zoneSchema, { method: 'POST', body: input });
}

export function updateZone(ctx: PanelContext, id: string, input: ZoneInput) {
	return panelRequest(ctx, `/shipping-zones/${segment(id)}`, zoneSchema, {
		method: 'PATCH',
		body: input
	});
}

/** `deactivated`: ya se usó en pedidos, así que se desactivó. */
export function removeZone(ctx: PanelContext, id: string) {
	return panelRequest(ctx, `/shipping-zones/${segment(id)}`, resultSchema, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Avisos de reposición
// ---------------------------------------------------------------------------

const restockSchema = z
	.object({
		id: z.string(),
		contact: z.string(),
		createdAt: z.string(),
		notifiedAt: z.string().nullable(),
		variantId: z.string(),
		stock: z.number(),
		productName: z.string(),
		productSlug: z.string(),
		colorName: z.string(),
		sizeLabel: z.string()
	})
	.transform((request) => ({
		id: request.id,
		contact: request.contact,
		created_at: request.createdAt,
		notified_at: request.notifiedAt,
		variants: {
			id: request.variantId,
			stock: request.stock,
			colors: { name: request.colorName },
			sizes: { label: request.sizeLabel },
			products: { name: request.productName, slug: request.productSlug }
		}
	}));

export type RestockRow = z.output<typeof restockSchema>;

export function listRestock(ctx: PanelContext): Promise<ApiResult<RestockRow[]>> {
	return panelRequest(ctx, '/restock-requests', z.array(restockSchema));
}

export function markRestockNotified(ctx: PanelContext, id: string, notified: boolean) {
	return panelRequest(ctx, `/restock-requests/${segment(id)}`, restockSchema, {
		method: 'PATCH',
		body: { notified }
	});
}
