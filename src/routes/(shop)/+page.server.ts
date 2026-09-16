import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getHome } from '$lib/server/api/storefront';
import { publicContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const { collections, settings } = await event.parent();
	const result = await getHome(publicContext(event));

	if (!result.ok) error(503, result.message);

	// La colección del hero la elige la administradora; si no hay, mandan los
	// textos de ajustes.
	const heroCollection =
		collections.find((collection) => collection.id === settings.hero_collection_id) ?? null;

	return { ...result.data, heroCollection };
};
