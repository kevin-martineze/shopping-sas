import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { stockUpdateSchema } from '$lib/schemas/admin';
import { listInventory, updateVariant } from '$lib/server/api/panel-catalog';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const onlyLow = event.url.searchParams.get('bajo') === '1';

	// Agrupado por producto, empezando por lo que está por agotarse, para editar
	// como quien revisa el perchero.
	return { groups: orFail(await listInventory(panelContext(event), onlyLow)), onlyLow };
};

export const actions: Actions = {
	stock: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const parsed = stockUpdateSchema.safeParse({
			variantId: formData.get('variantId'),
			stock: formData.get('stock')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Cantidad inválida.' });
		}

		const result = await updateVariant(ctx, parsed.data.variantId, { stock: parsed.data.stock });

		if (!result.ok) return failWith(result);

		return { ok: true };
	}
};
