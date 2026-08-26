import type { PostgrestError } from '@supabase/supabase-js';

import type { Category, Color, Size } from '$lib/domain/catalog';

import { supabaseAdmin } from '$lib/server/supabase';

/**
 * Catálogos base de la tienda: colores, tallas y categorías. Son las listas de
 * las que cuelga todo lo demás, así que nunca se borra algo que esté en uso.
 */

/** Postgres devuelve este código cuando una clave foránea impide el borrado. */
const FOREIGN_KEY_VIOLATION = '23503';

export interface RemovalResult {
	/** true cuando la fila seguía en uso y se ocultó en vez de borrarse. */
	hidden: boolean;
}

export class CatalogError extends Error {}

/**
 * Intenta borrar y, si la fila está en uso, la oculta. Así una talla que salió
 * en pedidos viejos deja de ofrecerse sin romper el historial.
 */
export async function removeOrHide(
	table: 'colors' | 'sizes' | 'categories',
	id: string
): Promise<RemovalResult> {
	const client = supabaseAdmin();
	const { error } = await client.from(table).delete().eq('id', id);

	if (!error) return { hidden: false };

	if (error.code !== FOREIGN_KEY_VIOLATION) {
		throw new CatalogError(error.message);
	}

	const { error: hideError } = await client.from(table).update({ active: false }).eq('id', id);

	if (hideError) throw new CatalogError(hideError.message);

	return { hidden: true };
}

/** Traduce el resultado a un mensaje para la administradora. */
export function removalMessage(result: RemovalResult, noun: string): string {
	return result.hidden
		? `${noun} está en uso, así que se ocultó en vez de borrarse. Los pedidos y prendas que ya lo tenían no cambian.`
		: `${noun} se borró.`;
}

export function isForeignKeyViolation(error: PostgrestError | null): boolean {
	return error?.code === FOREIGN_KEY_VIOLATION;
}

export async function listColors(includeHidden = false): Promise<Color[]> {
	let query = supabaseAdmin().from('colors').select('*').order('sort_order');
	if (!includeHidden) query = query.eq('active', true);

	const { data, error } = await query.returns<Color[]>();

	if (error) throw new CatalogError(error.message);
	return data ?? [];
}

export async function listSizes(includeHidden = false): Promise<Size[]> {
	let query = supabaseAdmin().from('sizes').select('*').order('sort_order');
	if (!includeHidden) query = query.eq('active', true);

	const { data, error } = await query.returns<Size[]>();

	if (error) throw new CatalogError(error.message);
	return data ?? [];
}

export async function listAdminCategories(): Promise<Category[]> {
	const { data, error } = await supabaseAdmin()
		.from('categories')
		.select('*')
		.order('sort_order')
		.returns<Category[]>();

	if (error) throw new CatalogError(error.message);
	return data ?? [];
}

/** Cuántas prendas o variantes dependen de cada fila, para avisar antes de borrar. */
export interface CatalogUsage {
	colors: Record<string, number>;
	sizes: Record<string, number>;
	categories: Record<string, number>;
}

interface VariantUsageRow {
	color_id: string;
	size_id: string;
}

interface ProductCategoryRow {
	category_id: string | null;
}

export async function getCatalogUsage(): Promise<CatalogUsage> {
	const client = supabaseAdmin();

	const [variants, products] = await Promise.all([
		client.from('variants').select('color_id, size_id').returns<VariantUsageRow[]>(),
		client.from('products').select('category_id').returns<ProductCategoryRow[]>()
	]);

	const usage: CatalogUsage = { colors: {}, sizes: {}, categories: {} };

	for (const variant of variants.data ?? []) {
		usage.colors[variant.color_id] = (usage.colors[variant.color_id] ?? 0) + 1;
		usage.sizes[variant.size_id] = (usage.sizes[variant.size_id] ?? 0) + 1;
	}

	for (const product of products.data ?? []) {
		if (!product.category_id) continue;
		usage.categories[product.category_id] = (usage.categories[product.category_id] ?? 0) + 1;
	}

	return usage;
}
