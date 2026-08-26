import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { heroSchema, homeHighlightSchema } from '$lib/schemas/admin';
import { getSettings, listCollections, listHomeHighlights } from '$lib/server/store';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	const client = supabaseAdmin();

	const [settings, collections, highlights] = await Promise.all([
		getSettings(locals.supabase),
		listCollections(client),
		listHomeHighlights(client, true)
	]);

	return { settings, collections, highlights };
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
	hero: async ({ request }) => {
		const formData = await request.formData();

		const parsed = heroSchema.safeParse({
			heroCollectionId: String(formData.get('heroCollectionId') ?? '') || null,
			heroTitle: formData.get('heroTitle') ?? '',
			heroSubtitle: formData.get('heroSubtitle') ?? ''
		});

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const { error } = await supabaseAdmin()
			.from('settings')
			.update({
				hero_collection_id: parsed.data.heroCollectionId ?? null,
				hero_title: parsed.data.heroTitle || null,
				hero_subtitle: parsed.data.heroSubtitle || null
			})
			.eq('id', true);

		if (error) return fail(500, { error: 'No pudimos guardar la portada.' });

		return { message: 'Portada guardada.' };
	},

	crearBloque: async ({ request }) => {
		const parsed = parseHighlight(await request.formData());
		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const { error } = await supabaseAdmin().from('home_highlights').insert({
			eyebrow: parsed.data.eyebrow,
			title: parsed.data.title,
			body: parsed.data.body,
			sort_order: parsed.data.sortOrder,
			active: parsed.data.active
		});

		if (error) return fail(500, { error: 'No pudimos crear el bloque.' });

		return { message: 'Bloque creado.' };
	},

	actualizarBloque: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const parsed = parseHighlight(formData);

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const { error } = await supabaseAdmin()
			.from('home_highlights')
			.update({
				eyebrow: parsed.data.eyebrow,
				title: parsed.data.title,
				body: parsed.data.body,
				sort_order: parsed.data.sortOrder,
				active: parsed.data.active
			})
			.eq('id', id);

		if (error) return fail(500, { error: 'No pudimos guardar el bloque.' });

		return { message: 'Bloque guardado.' };
	},

	borrarBloque: async ({ request }) => {
		const formData = await request.formData();

		const { error } = await supabaseAdmin()
			.from('home_highlights')
			.delete()
			.eq('id', String(formData.get('id') ?? ''));

		if (error) return fail(500, { error: 'No pudimos borrar el bloque.' });

		return { message: 'Bloque borrado.' };
	}
};
