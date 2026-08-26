import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { listFeatured, listNewest } from '$lib/server/catalog';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { collections } = await parent();

	try {
		const [featured, newest] = await Promise.all([
			listFeatured(locals.supabase, 8),
			listNewest(locals.supabase, 8)
		]);

		return {
			featured,
			newest,
			heroCollection: collections.at(0) ?? null
		};
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : 'No pudimos cargar el catálogo.';
		error(503, message);
	}
};
