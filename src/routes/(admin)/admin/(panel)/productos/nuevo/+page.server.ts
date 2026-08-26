import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { productSchema } from '$lib/schemas/admin';
import { listCategories } from '$lib/server/store';
import { supabaseAdmin } from '$lib/server/supabase';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async ({ locals }) => {
	return { categories: await listCategories(locals.supabase) };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '');
		const rawSlug = String(formData.get('slug') ?? '').trim();

		const parsed = productSchema.safeParse({
			name,
			slug: rawSlug === '' ? slugify(name) : rawSlug,
			description: formData.get('description') ?? '',
			material: formData.get('material') ?? '',
			care: formData.get('care') ?? '',
			categoryId: String(formData.get('categoryId') ?? '') || null,
			basePrice: formData.get('basePrice'),
			compareAtPrice: String(formData.get('compareAtPrice') ?? '') || null,
			status: formData.get('status') ?? 'draft',
			featured: formData.get('featured') === 'on'
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const input = parsed.data;

		const { data, error } = await supabaseAdmin()
			.from('products')
			.insert({
				name: input.name,
				slug: input.slug,
				description: input.description || null,
				material: input.material || null,
				care: input.care || null,
				category_id: input.categoryId ?? null,
				base_price: input.basePrice,
				compare_at_price: input.compareAtPrice || null,
				status: input.status,
				featured: input.featured
			})
			.select('id')
			.maybeSingle<{ id: string }>();

		if (error || !data) {
			const duplicated = error?.code === '23505';

			return fail(400, {
				error: duplicated
					? 'Ya existe una prenda con ese slug.'
					: 'No pudimos crear la prenda. Intenta de nuevo.'
			});
		}

		// Se sigue a la edición: ahí se cargan fotos y se arma la matriz de tallas.
		redirect(303, `/admin/productos/${data.id}`);
	}
};
