import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { stockUpdateSchema } from '$lib/schemas/admin';
import { supabaseAdmin } from '$lib/server/supabase';

interface InventoryRow {
	id: string;
	sku: string | null;
	stock: number;
	active: boolean;
	colors: { name: string; hex: string } | null;
	sizes: { label: string; sort_order: number } | null;
	products: { id: string; name: string; slug: string; status: string } | null;
}

export const load: PageServerLoad = async ({ url }) => {
	const onlyLow = url.searchParams.get('bajo') === '1';

	let query = supabaseAdmin()
		.from('variants')
		.select(
			`id, sku, stock, active,
			colors ( name, hex ),
			sizes ( label, sort_order ),
			products ( id, name, slug, status )`
		)
		.order('stock', { ascending: true })
		.limit(400);

	if (onlyLow) query = query.lte('stock', 3);

	const { data, error } = await query.returns<InventoryRow[]>();

	if (error) throw error;

	// Agrupado por prenda para editar como quien revisa el perchero.
	const byProduct = new Map<string, { name: string; slug: string; rows: InventoryRow[] }>();

	for (const row of data ?? []) {
		if (!row.products) continue;

		const entry = byProduct.get(row.products.id) ?? {
			name: row.products.name,
			slug: row.products.slug,
			rows: []
		};

		entry.rows.push(row);
		byProduct.set(row.products.id, entry);
	}

	return {
		groups: [...byProduct.entries()].map(([id, entry]) => ({ id, ...entry })),
		onlyLow
	};
};

export const actions: Actions = {
	stock: async ({ request }) => {
		const formData = await request.formData();

		const parsed = stockUpdateSchema.safeParse({
			variantId: formData.get('variantId'),
			stock: formData.get('stock')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Cantidad inválida.' });
		}

		const { error } = await supabaseAdmin()
			.from('variants')
			.update({ stock: parsed.data.stock })
			.eq('id', parsed.data.variantId);

		if (error) return fail(500, { error: 'No pudimos guardar el inventario.' });

		return { ok: true };
	}
};
