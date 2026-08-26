import type { SupabaseClient } from '@supabase/supabase-js';

import type { AppliedCoupon, ShippingZone, StoreSettings } from '$lib/domain/settings';
import type { CartTotals, PricedLine } from '$lib/domain/orders';

/** Lo que manda el navegador: nunca precios, solo identificadores y cantidades. */
export interface RawCartLine {
	variantId: string;
	qty: number;
}

interface VariantRow {
	id: string;
	stock: number;
	price_override: number | null;
	colors: { name: string } | null;
	sizes: { label: string } | null;
	products: {
		id: string;
		name: string;
		slug: string;
		base_price: number;
		status: string;
		product_images: { url_thumb: string; sort_order: number }[];
	} | null;
}

/** Valida y normaliza el JSON del carrito recibido en una form action. */
export function parseCartPayload(raw: FormDataEntryValue | null): RawCartLine[] {
	if (typeof raw !== 'string') return [];

	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}

	if (!Array.isArray(parsed)) return [];

	const lines: RawCartLine[] = [];

	for (const entry of parsed) {
		if (typeof entry !== 'object' || entry === null) continue;

		const record: Record<string, unknown> = { ...entry };
		const variantId = record.variantId;
		const qty = record.qty;

		if (typeof variantId !== 'string' || typeof qty !== 'number') continue;
		if (!Number.isFinite(qty) || qty <= 0) continue;

		lines.push({ variantId, qty: Math.min(Math.floor(qty), 20) });
	}

	return lines;
}

export interface PricedCart {
	lines: PricedLine[];
	/** Líneas que ya no existen o quedaron sin stock; se avisan en pantalla. */
	removed: { variantId: string; label: string }[];
	subtotal: number;
}

/**
 * Recalcula el carrito contra la base de datos: precios frescos, stock real
 * y recorte de cantidades imposibles. Es la única fuente de verdad de precios.
 */
export async function priceCart(
	supabase: SupabaseClient,
	rawLines: RawCartLine[]
): Promise<PricedCart> {
	if (rawLines.length === 0) return { lines: [], removed: [], subtotal: 0 };

	const { data, error } = await supabase
		.from('variants')
		.select(
			`id, stock, price_override,
			colors ( name ),
			sizes ( label ),
			products ( id, name, slug, base_price, status, product_images ( url_thumb, sort_order ) )`
		)
		.in(
			'id',
			rawLines.map((line) => line.variantId)
		)
		.eq('active', true)
		.returns<VariantRow[]>();

	if (error) throw error;

	const byId = new Map((data ?? []).map((row) => [row.id, row]));
	const lines: PricedLine[] = [];
	const removed: PricedCart['removed'] = [];

	for (const raw of rawLines) {
		const variant = byId.get(raw.variantId);

		if (!variant || !variant.products || variant.products.status !== 'active') {
			removed.push({ variantId: raw.variantId, label: 'Prenda no disponible' });
			continue;
		}

		const label = `${variant.products.name} — ${variant.colors?.name ?? ''} / ${variant.sizes?.label ?? ''}`;

		if (variant.stock <= 0) {
			removed.push({ variantId: raw.variantId, label });
			continue;
		}

		const qty = Math.min(raw.qty, variant.stock);
		const unitPrice = variant.price_override ?? variant.products.base_price;
		const image = [...variant.products.product_images].sort(
			(a, b) => a.sort_order - b.sort_order
		)[0];

		lines.push({
			variantId: variant.id,
			productId: variant.products.id,
			productName: variant.products.name,
			productSlug: variant.products.slug,
			colorName: variant.colors?.name ?? '',
			sizeLabel: variant.sizes?.label ?? '',
			unitPrice,
			qty,
			lineTotal: unitPrice * qty,
			stock: variant.stock,
			imageUrl: image?.url_thumb ?? null,
			adjustedFrom: qty < raw.qty ? raw.qty : null
		});
	}

	return {
		lines,
		removed,
		subtotal: lines.reduce((sum, line) => sum + line.lineTotal, 0)
	};
}

export interface CouponCheck {
	applied: AppliedCoupon | null;
	rejection: string | null;
}

interface CouponRpcResult {
	ok: boolean;
	reason: string | null;
	code: string | null;
	type: 'percent' | 'fixed' | null;
	value: number | null;
	discount: number | null;
}

/**
 * `validate_coupon` devuelve jsonb, así que llega sin tipo desde PostgREST.
 * Se lee campo a campo en vez de castear.
 */
function readCouponResult(value: unknown): CouponRpcResult | null {
	if (typeof value !== 'object' || value === null) return null;

	const record: Record<string, unknown> = { ...value };
	const type = record.type;

	return {
		ok: record.ok === true,
		reason: typeof record.reason === 'string' ? record.reason : null,
		code: typeof record.code === 'string' ? record.code : null,
		type: type === 'percent' || type === 'fixed' ? type : null,
		value: typeof record.value === 'number' ? record.value : null,
		discount: typeof record.discount === 'number' ? record.discount : null
	};
}

export async function checkCoupon(
	supabase: SupabaseClient,
	code: string,
	subtotal: number
): Promise<CouponCheck> {
	if (code.trim() === '') return { applied: null, rejection: null };

	const { data, error } = await supabase.rpc('validate_coupon', {
		p_code: code,
		p_subtotal: subtotal
	});

	if (error) throw error;

	const result = readCouponResult(data);

	if (!result?.ok) {
		return { applied: null, rejection: result?.reason ?? 'not_found' };
	}

	return {
		applied: {
			code: result.code ?? code.toUpperCase(),
			type: result.type ?? 'fixed',
			value: result.value ?? 0,
			discount: result.discount ?? 0
		},
		rejection: null
	};
}

/**
 * Calcula los totales igual que `create_order` en la base de datos.
 * Si cambia una regla aquí, hay que cambiarla también en la función SQL.
 */
export function computeTotals(
	subtotal: number,
	coupon: AppliedCoupon | null,
	zone: ShippingZone | null,
	settings: StoreSettings
): CartTotals {
	const discount = Math.min(coupon?.discount ?? 0, subtotal);
	let shippingCost = zone?.cost ?? 0;

	const threshold = settings.free_shipping_threshold;
	if (threshold !== null && subtotal - discount >= threshold) {
		shippingCost = 0;
	}

	return {
		subtotal,
		discount,
		shippingCost,
		total: subtotal - discount + shippingCost
	};
}
