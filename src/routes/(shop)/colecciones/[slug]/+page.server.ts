import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getCollection } from '$lib/server/api/storefront';
import { publicContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const result = await getCollection(publicContext(event), event.params.slug);

	if (!result.ok) {
		if (result.status === 404) error(404, 'Esa colección no existe.');
		error(503, result.message);
	}

	return { collection: result.data };
};
