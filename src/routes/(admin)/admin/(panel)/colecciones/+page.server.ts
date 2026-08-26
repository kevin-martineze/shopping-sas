import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { collectionSchema } from '$lib/schemas/admin';
import { listAdminProducts } from '$lib/server/admin';
import { listCollections } from '$lib/server/store';
import { supabaseAdmin } from '$lib/server/supabase';
import { slugify } from '$lib/utils/slug';

interface CollectionProductRow {
	collection_id: string;
	product_id: string;
	sort_order: number;
	hotspot_x: number | null;
	hotspot_y: number | null;
	products: { name: string } | null;
}

export const load: PageServerLoad = async () => {
	const client = supabaseAdmin();

	const [collections, products, links] = await Promise.all([
		listCollections(client),
		listAdminProducts(null),
		client
			.from('collection_products')
			.select('collection_id, product_id, sort_order, hotspot_x, hotspot_y, products ( name )')
			.order('sort_order')
			.returns<CollectionProductRow[]>()
	]);

	return {
		collections,
		products: products.map((product) => ({ id: product.id, name: product.name })),
		links: links.data ?? []
	};
};

export const actions: Actions = {
	crear: async ({ request }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '');
		const rawSlug = String(formData.get('slug') ?? '').trim();

		const parsed = collectionSchema.safeParse({
			name,
			slug: rawSlug === '' ? slugify(name) : rawSlug,
			description: formData.get('description') ?? '',
			heroImageUrl: formData.get('heroImageUrl') ?? '',
			active: formData.get('active') === 'on',
			sortOrder: formData.get('sortOrder') || 0
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const { error } = await supabaseAdmin()
			.from('collections')
			.insert({
				name: parsed.data.name,
				slug: parsed.data.slug,
				description: parsed.data.description || null,
				hero_image_url: parsed.data.heroImageUrl || null,
				active: parsed.data.active,
				sort_order: parsed.data.sortOrder
			});

		if (error) {
			return fail(400, {
				error:
					error.code === '23505' ? 'Ya existe una colección con ese slug.' : 'No pudimos crearla.'
			});
		}

		return { ok: true };
	},

	/** Etiqueta un producto sobre la foto editorial en la posición indicada. */
	agregarProducto: async ({ request }) => {
		const formData = await request.formData();
		const collectionId = String(formData.get('collectionId') ?? '');
		const productId = String(formData.get('productId') ?? '');
		const x = Number(formData.get('hotspotX') ?? '');
		const y = Number(formData.get('hotspotY') ?? '');

		if (!collectionId || !productId) {
			return fail(400, { error: 'Elige colección y prenda.' });
		}

		const inRange = (value: number) => Number.isFinite(value) && value >= 0 && value <= 100;

		const { error } = await supabaseAdmin()
			.from('collection_products')
			.upsert({
				collection_id: collectionId,
				product_id: productId,
				hotspot_x: inRange(x) ? x : null,
				hotspot_y: inRange(y) ? y : null,
				sort_order: 0
			});

		if (error) return fail(500, { error: 'No pudimos agregar la prenda.' });

		return { ok: true };
	},

	quitarProducto: async ({ request }) => {
		const formData = await request.formData();

		const { error } = await supabaseAdmin()
			.from('collection_products')
			.delete()
			.eq('collection_id', String(formData.get('collectionId') ?? ''))
			.eq('product_id', String(formData.get('productId') ?? ''));

		if (error) return fail(500, { error: 'No pudimos quitar la prenda.' });

		return { ok: true };
	},

	eliminar: async ({ request }) => {
		const formData = await request.formData();

		const { error } = await supabaseAdmin()
			.from('collections')
			.delete()
			.eq('id', String(formData.get('id') ?? ''));

		if (error) return fail(500, { error: 'No pudimos borrar la colección.' });

		return { ok: true };
	}
};
