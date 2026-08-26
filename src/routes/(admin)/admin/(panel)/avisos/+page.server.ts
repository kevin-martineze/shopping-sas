import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { listRestockRequests } from '$lib/server/admin';
import { getSettings } from '$lib/server/store';
import { serverEnv } from '$lib/server/env';
import { supabaseAdmin } from '$lib/server/supabase';
import { buildRestockUrl } from '$lib/utils/whatsapp';

export const load: PageServerLoad = async ({ locals }) => {
	const [requests, settings] = await Promise.all([
		listRestockRequests(),
		getSettings(locals.supabase)
	]);

	const siteUrl = serverEnv().PUBLIC_SITE_URL;

	return {
		requests: requests.map((request) => {
			const product = request.variants?.products;
			const productUrl = product ? new URL(`/tienda/${product.slug}`, siteUrl).toString() : siteUrl;

			return {
				...request,
				// Solo tiene sentido escribirle si la talla volvió a tener stock.
				backInStock: (request.variants?.stock ?? 0) > 0,
				chatUrl: buildRestockUrl(
					request.contact,
					settings.store_name,
					product?.name ?? 'tu prenda',
					request.variants?.sizes?.label ?? '',
					productUrl
				)
			};
		})
	};
};

export const actions: Actions = {
	notificado: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		const { error } = await supabaseAdmin()
			.from('restock_requests')
			.update({ notified_at: new Date().toISOString() })
			.eq('id', id);

		if (error) return fail(500, { error: 'No pudimos marcar el aviso.' });

		return { ok: true };
	}
};
