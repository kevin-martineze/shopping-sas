/**
 * Formato de precios en pesos colombianos.
 * El COP no usa decimales, así que todo se guarda y se muestra como entero.
 */

const formatter = new Intl.NumberFormat('es-CO', {
	style: 'currency',
	currency: 'COP',
	minimumFractionDigits: 0,
	maximumFractionDigits: 0
});

export function formatMoney(value: number): string {
	// Intl deja "COP 89.900" o "$ 89.900" según el runtime; normalizamos a "$89.900".
	return formatter
		.format(Math.round(value))
		.replace(/^COP\s?/, '$')
		.replace(/\s/g, '');
}

/** Versión sin símbolo, para inputs del panel de administración. */
export function formatAmount(value: number): string {
	return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(value));
}

/** Lee un precio escrito por la administradora ("89.900", "$89900", "89 900"). */
export function parseAmount(raw: string): number | null {
	const digits = raw.replace(/[^\d]/g, '');
	if (digits === '') return null;

	const value = Number(digits);
	return Number.isFinite(value) ? value : null;
}

export function discountPercent(price: number, compareAt: number | null): number | null {
	if (compareAt === null || compareAt <= price) return null;
	return Math.round(((compareAt - price) / compareAt) * 100);
}
