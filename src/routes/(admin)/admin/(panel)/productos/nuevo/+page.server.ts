import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { productSchema } from '$lib/schemas/admin';
import { createProduct, listCategories } from '$lib/server/api/panel-catalog';
import { failWith, orFail, panelContext } from '$lib/server/context';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async (event) => {
	return { categories: orFail(await listCategories(panelContext(event))) };
};

export const actions: Actions = {
	default: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
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

		const result = await createProduct(ctx, {
			name: input.name,
			slug: input.slug,
			description: input.description,
			material: input.material,
			care: input.care,
			categoryId: input.categoryId ?? null,
			basePrice: input.basePrice,
			compareAtPrice: input.compareAtPrice ?? null,
			status: input.status,
			featured: input.featured
		});

		if (!result.ok) return failWith(result);

		// Se sigue a la edición: ahí se cargan fotos y se arma la matriz de tallas.
		redirect(303, `/admin/productos/${result.data.id}`);
	}
};
