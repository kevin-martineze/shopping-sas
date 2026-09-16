import { error } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';
import { getStorefront } from '$lib/server/api/storefront';
import { publicContext } from '$lib/server/context';

export const load: LayoutServerLoad = async (event) => {
	const result = await getStorefront(publicContext(event));

	if (!result.ok) {
		if (result.status === 404) error(404, 'Esta tienda no existe.');
		error(503, result.message);
	}

	return result.data;
};
