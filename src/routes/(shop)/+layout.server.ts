import { error } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';
import { listCategories, listCollections, getSettings } from '$lib/server/store';

export const load: LayoutServerLoad = async ({ locals }) => {
	try {
		const [settings, categories, collections] = await Promise.all([
			getSettings(locals.supabase),
			listCategories(locals.supabase),
			listCollections(locals.supabase)
		]);

		return { settings, categories, collections };
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : 'No pudimos cargar la tienda.';
		error(503, message);
	}
};
