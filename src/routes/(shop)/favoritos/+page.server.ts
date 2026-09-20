import { fail } from '@sveltejs/kit';

import type { Actions } from './$types';
import { lookupProducts } from '$lib/server/api/storefront';
import { publicContext } from '$lib/server/context';

export const actions: Actions = {
	/**
	 * Los favoritos viven en localStorage: el navegador manda los slugs y el
	 * servidor devuelve las fichas con precio y stock frescos.
	 */
	default: async (event) => {
		const formData = await event.request.formData();
		const raw = formData.get('slugs');

		if (typeof raw !== 'string' || raw.trim() === '') {
			return { products: [] };
		}

		const slugs = raw
			.split(',')
			.map((slug) => slug.trim())
			.filter((slug) => /^[a-z0-9-]{1,80}$/.test(slug))
			.slice(0, 60);

		const result = await lookupProducts(publicContext(event), slugs);

		if (!result.ok) return fail(503, { products: [], error: result.message });

		return { products: result.data };
	}
};
