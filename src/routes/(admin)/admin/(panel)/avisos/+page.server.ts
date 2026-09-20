import type { Actions, PageServerLoad } from './$types';
import { listRestock, markRestockNotified } from '$lib/server/api/panel-commerce';
import { failWith, orFail, panelContext } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';
import { buildRestockUrl } from '$lib/utils/whatsapp';

export const load: PageServerLoad = async (event) => {
	const { settings } = await event.parent();
	const requests = orFail(await listRestock(panelContext(event)));
	const siteUrl = serverEnv().PUBLIC_SITE_URL;

	return {
		requests: requests.map((request) => {
			const product = request.variants.products;
			const productUrl = new URL(`/tienda/${product.slug}`, siteUrl).toString();

			return {
				...request,
				// Solo tiene sentido escribirle si la talla volvió a tener stock.
				backInStock: request.variants.stock > 0,
				chatUrl: buildRestockUrl(
					request.contact,
					settings.store_name,
					product.name,
					request.variants.sizes.label,
					productUrl
				)
			};
		})
	};
};

export const actions: Actions = {
	notificado: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const result = await markRestockNotified(ctx, String(formData.get('id') ?? ''), true);

		if (!result.ok) return failWith(result);

		return { ok: true };
	}
};
