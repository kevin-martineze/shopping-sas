import type { Color, Product, Size } from '$lib/domain/catalog';
import type { Coupon } from '$lib/domain/settings';

import { supabaseAdmin } from '$lib/server/supabase';

/** Consultas del panel. Siempre con service role: ya se verificó la sesión. */

export interface AdminProductRow extends Product {
	categories: { name: string } | null;
	variants: { stock: number }[];
	product_images: { url_thumb: string; sort_order: number }[];
}

export async function listAdminProducts(search: string | null): Promise<AdminProductRow[]> {
	let query = supabaseAdmin()
		.from('products')
		.select('*, categories ( name ), variants ( stock ), product_images ( url_thumb, sort_order )')
		.order('created_at', { ascending: false })
		.limit(200);

	if (search) query = query.ilike('name', `%${search}%`);

	const { data, error } = await query.returns<AdminProductRow[]>();

	if (error) throw error;
	return data ?? [];
}

export interface AdminVariantRow {
	id: string;
	sku: string | null;
	stock: number;
	price_override: number | null;
	active: boolean;
	color_id: string;
	size_id: string;
	colors: Pick<Color, 'id' | 'name' | 'hex'> | null;
	sizes: Pick<Size, 'id' | 'label' | 'sort_order'> | null;
}

export interface AdminProductDetail extends Product {
	product_images: {
		id: string;
		color_id: string | null;
		storage_path: string;
		url_thumb: string;
		url_card: string;
		sort_order: number;
		alt: string | null;
	}[];
	variants: AdminVariantRow[];
}

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
	const { data, error } = await supabaseAdmin()
		.from('products')
		.select(
			`*,
			product_images ( id, color_id, storage_path, url_thumb, url_card, sort_order, alt ),
			variants ( id, sku, stock, price_override, active, color_id, size_id, colors ( id, name, hex ), sizes ( id, label, sort_order ) )`
		)
		.eq('id', id)
		.maybeSingle<AdminProductDetail>();

	if (error) throw error;
	return data;
}

export async function listCoupons(): Promise<Coupon[]> {
	const { data, error } = await supabaseAdmin()
		.from('coupons')
		.select('*')
		.order('created_at', { ascending: false })
		.returns<Coupon[]>();

	if (error) throw error;
	return data ?? [];
}

export interface RestockRow {
	id: string;
	contact: string;
	created_at: string;
	notified_at: string | null;
	variants: {
		id: string;
		stock: number;
		colors: { name: string } | null;
		sizes: { label: string } | null;
		products: { name: string; slug: string } | null;
	} | null;
}

export async function listRestockRequests(): Promise<RestockRow[]> {
	const { data, error } = await supabaseAdmin()
		.from('restock_requests')
		.select(
			`id, contact, created_at, notified_at,
			variants ( id, stock, colors ( name ), sizes ( label ), products ( name, slug ) )`
		)
		.order('created_at', { ascending: false })
		.limit(200)
		.returns<RestockRow[]>();

	if (error) throw error;
	return data ?? [];
}

export interface DashboardStats {
	pendingOrders: number;
	stalePendingOrders: number;
	monthRevenue: number;
	monthOrders: number;
	lowStock: {
		id: string;
		stock: number;
		productName: string;
		colorName: string;
		sizeLabel: string;
	}[];
	pendingRestock: number;
}

interface LowStockRow {
	id: string;
	stock: number;
	colors: { name: string } | null;
	sizes: { label: string } | null;
	products: { name: string; status: string } | null;
}

export async function getDashboardStats(): Promise<DashboardStats> {
	const client = supabaseAdmin();

	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	// Un pedido pendiente que ya cumplió 24 h retiene stock sin avanzar: se destaca.
	const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

	const [pending, stale, month, lowStock, restock] = await Promise.all([
		client.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
		client
			.from('orders')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'pending')
			.lt('created_at', staleThreshold),
		client
			.from('orders')
			.select('total')
			.neq('status', 'cancelled')
			.gte('created_at', startOfMonth.toISOString())
			.returns<{ total: number }[]>(),
		client
			.from('variants')
			.select('id, stock, colors ( name ), sizes ( label ), products ( name, status )')
			.lte('stock', 3)
			.eq('active', true)
			.order('stock', { ascending: true })
			.limit(12)
			.returns<LowStockRow[]>(),
		client
			.from('restock_requests')
			.select('id', { count: 'exact', head: true })
			.is('notified_at', null)
	]);

	const monthOrders = month.data ?? [];

	return {
		pendingOrders: pending.count ?? 0,
		stalePendingOrders: stale.count ?? 0,
		monthRevenue: monthOrders.reduce((sum, order) => sum + order.total, 0),
		monthOrders: monthOrders.length,
		lowStock: (lowStock.data ?? [])
			.filter((row) => row.products?.status === 'active')
			.map((row) => ({
				id: row.id,
				stock: row.stock,
				productName: row.products?.name ?? '',
				colorName: row.colors?.name ?? '',
				sizeLabel: row.sizes?.label ?? ''
			})),
		pendingRestock: restock.count ?? 0
	};
}
