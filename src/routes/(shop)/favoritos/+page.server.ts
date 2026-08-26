import type { Actions } from './$types';
import { listBySlugs } from '$lib/server/catalog';

export const actions: Actions = {
	/**
	 * Los favoritos viven en localStorage: el navegador manda los slugs y el
	 * servidor devuelve las fichas con precio y stock frescos.
	 */
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const raw = formData.get('slugs');

		if (typeof raw !== 'string' || raw.trim() === '') {
			return { products: [] };
		}

		const slugs = raw
			.split(',')
			.map((slug) => slug.trim())
			.filter((slug) => /^[a-z0-9-]{1,80}$/.test(slug))
			.slice(0, 60);

		return { products: await listBySlugs(locals.supabase, slugs) };
	}
};
