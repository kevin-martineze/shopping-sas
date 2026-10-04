import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { heroSchema, homeHighlightSchema } from '$lib/schemas/admin';
import {
	createHighlight,
	getSettings,
	listCollections,
	listHighlights,
	removeHighlight,
	updateHighlight,
	updateSettings
} from '$lib/server/api/panel-content';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ctx = panelContext(event);

	const [settings, collections, highlights] = await Promise.all([
		getSettings(ctx),
		listCollections(ctx),
		listHighlights(ctx)
	]);

	return {
		settings: orFail(settings),
		collections: orFail(collections).collections,
		highlights: orFail(highlights)
	};
};

function parseHighlight(formData: FormData) {
	return homeHighlightSchema.safeParse({
		eyebrow: formData.get('eyebrow'),
		title: formData.get('title'),
		body: formData.get('body'),
		sortOrder: formData.get('sortOrder') || 0,
		active: formData.get('active') === 'on'
	});
}

const firstIssue = (issues: { message: string }[]) => issues.at(0)?.message ?? 'Revisa los datos.';

export const actions: Actions = {
	hero: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const parsed = heroSchema.safeParse({
			heroCollectionId: String(formData.get('heroCollectionId') ?? '') || null,
			heroTitle: formData.get('heroTitle') ?? '',
			heroSubtitle: formData.get('heroSubtitle') ?? ''
		});

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const result = await updateSettings(ctx, {
			heroCollectionId: parsed.data.heroCollectionId ?? null,
			heroTitle: parsed.data.heroTitle || null,
			heroSubtitle: parsed.data.heroSubtitle || null
		});

		if (!result.ok) return failWith(result);

		return { message: 'Portada guardada.' };
	},

	crearBloque: async (event) => {
		const ctx = panelContext(event);
		const parsed = parseHighlight(await event.request.formData());

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const result = await createHighlight(ctx, parsed.data);

		if (!result.ok) return failWith(result);

		return { message: 'Bloque creado.' };
	},

	actualizarBloque: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const parsed = parseHighlight(formData);

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const result = await updateHighlight(ctx, String(formData.get('id') ?? ''), parsed.data);

		if (!result.ok) return failWith(result);

		return { message: 'Bloque guardado.' };
	},

	borrarBloque: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const result = await removeHighlight(ctx, String(formData.get('id') ?? ''));

		if (!result.ok) return failWith(result);

		return { message: 'Bloque borrado.' };
	}
};
