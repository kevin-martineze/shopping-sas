/** Rango Unicode de marcas diacríticas combinantes que deja `normalize('NFD')`. */
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Convierte un nombre de producto en slug de URL: "Blusa Vera" → "blusa-vera". */
export function slugify(value: string): string {
	return value
		.normalize('NFD')
		.replace(COMBINING_MARKS, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 80);
}

/** SKU legible a partir del producto, color y talla. */
export function buildSku(productSlug: string, colorSlug: string, sizeLabel: string): string {
	const base = productSlug.replace(/-/g, '').toUpperCase().slice(0, 10);
	return `${base}-${colorSlug.toUpperCase()}-${sizeLabel.toUpperCase()}`;
}
