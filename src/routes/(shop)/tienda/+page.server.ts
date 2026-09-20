import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getFacets, parseFilters, searchProducts } from '$lib/server/api/storefront';
import { publicContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const filters = parseFilters(event.url);
	const ctx = publicContext(event);

	const [result, facets] = await Promise.all([searchProducts(ctx, filters), getFacets(ctx)]);

	if (!result.ok) error(result.status === 400 ? 400 : 503, result.message);
	if (!facets.ok) error(503, facets.message);

	return { ...result.data, facets: facets.data, filters };
};
