import type { PricedLine } from '$lib/domain/orders';

/** Tope por línea: el mismo que valida la API. */
const MAX_QTY_PER_LINE = 20;

/** Lo que manda el navegador: nunca precios, solo identificadores y cantidades. */
export interface RawCartLine {
	variantId: string;
	qty: number;
}

/** El carrito ya cotizado por la API: precios y stock de hoy. */
export interface PricedCart {
	lines: PricedLine[];
	/** Líneas que ya no existen o quedaron sin stock; se avisan en pantalla. */
	removed: { variantId: string; label: string }[];
	subtotal: number;
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

		lines.push({ variantId, qty: Math.min(Math.floor(qty), MAX_QTY_PER_LINE) });
	}

	return lines;
}
