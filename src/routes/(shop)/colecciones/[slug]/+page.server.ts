import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getCollectionBySlug } from '$lib/server/store';

export const load: PageServerLoad = async ({ locals, params }) => {
	const collection = await getCollectionBySlug(locals.supabase, params.slug);

	if (!collection) error(404, 'Esa colección no existe.');

	return { collection };
};
