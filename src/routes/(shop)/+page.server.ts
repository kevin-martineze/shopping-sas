import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { listFeatured, listNewest } from '$lib/server/catalog';
import { listHomeHighlights } from '$lib/server/store';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { collections, settings } = await parent();

	try {
		const [featured, newest, highlights] = await Promise.all([
			listFeatured(locals.supabase, 8),
			listNewest(locals.supabase, 8),
			listHomeHighlights(locals.supabase)
		]);

		// La colección del hero la elige la administradora; si no hay, mandan los
		// textos de ajustes.
		const heroCollection =
			collections.find((collection) => collection.id === settings.hero_collection_id) ?? null;

		return { featured, newest, highlights, heroCollection };
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : 'No pudimos cargar el catálogo.';
		error(503, message);
	}
};
