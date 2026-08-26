import { error, fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { getProductBySlug, listRelated } from '$lib/server/catalog';
import { restockSchema } from '$lib/schemas/checkout';

export const load: PageServerLoad = async ({ locals, params }) => {
	const product = await getProductBySlug(locals.supabase, params.slug).catch((cause: unknown) => {
		const message = cause instanceof Error ? cause.message : 'No pudimos cargar la prenda.';
		error(503, message);
	});

	if (!product) error(404, 'Esta prenda ya no está disponible.');

	const related = await listRelated(locals.supabase, product.categorySlug, product.slug, 4);

	return { product, related };
};

export const actions: Actions = {
	/** Aviso de reposición: queda como lead en el panel de administración. */
	avisarme: async ({ request, locals }) => {
		const formData = await request.formData();
		const parsed = restockSchema.safeParse({
			variantId: formData.get('variantId'),
			contact: formData.get('contact')
		});

		if (!parsed.success) {
			return fail(400, {
				restockError: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.'
			});
		}

		const { error: insertError } = await locals.supabase.from('restock_requests').insert({
			variant_id: parsed.data.variantId,
			contact: parsed.data.contact
		});

		if (insertError) {
			return fail(500, { restockError: 'No pudimos guardar tu aviso. Intenta de nuevo.' });
		}

		return { restockOk: true };
	}
};
