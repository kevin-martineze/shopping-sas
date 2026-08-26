import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getFacets, listProducts, parseFilters } from '$lib/server/catalog';

export const load: PageServerLoad = async ({ locals, url }) => {
	const filters = parseFilters(url);

	try {
		const [result, facets] = await Promise.all([
			listProducts(locals.supabase, filters),
			getFacets(locals.supabase)
		]);

		return { ...result, facets, filters };
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : 'No pudimos cargar el catálogo.';
		error(503, message);
	}
};
