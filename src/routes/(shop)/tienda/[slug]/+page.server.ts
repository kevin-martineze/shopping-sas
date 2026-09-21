import { error, fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { restockSchema } from '$lib/schemas/checkout';
import { getProduct, listRelated, requestRestock } from '$lib/server/api/storefront';
import { publicContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ctx = publicContext(event);
	const product = await getProduct(ctx, event.params.slug);

	if (!product.ok) {
		if (product.status === 404) error(404, 'Esta producto ya no está disponible.');
		error(503, product.message);
	}

	// Las relacionadas son un extra: si fallan, la ficha se muestra igual.
	const related = await listRelated(ctx, event.params.slug);

	return { product: product.data, related: related.ok ? related.data : [] };
};

export const actions: Actions = {
	/** Aviso de reposición: queda como lead en el panel de administración. */
	avisarme: async (event) => {
		const formData = await event.request.formData();
		const parsed = restockSchema.safeParse({
			variantId: formData.get('variantId'),
			contact: formData.get('contact')
		});

		if (!parsed.success) {
			return fail(400, {
				restockError: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.'
			});
		}

		const result = await requestRestock(
			publicContext(event),
			parsed.data.variantId,
			parsed.data.contact
		);

		if (!result.ok) {
			if (result.status === 404) {
				return fail(404, { restockError: 'Esa variación ya no está disponible.' });
			}

			return fail(result.status === 429 ? 429 : 500, {
				restockError:
					result.status === 429 ? result.message : 'No pudimos guardar tu aviso. Intenta de nuevo.'
			});
		}

		return { restockOk: true };
	}
};
