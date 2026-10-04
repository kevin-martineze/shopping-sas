import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { accentProblem, isEmptyTheme } from '$lib/domain/theme';
import { storeThemeSchema, templateSchema } from '$lib/schemas/admin';
import { getSettings, updateSettings } from '$lib/server/api/panel-content';
import { requireAdmin } from '$lib/server/auth';
import { failWith, orFail, panelContext, storeUrl } from '$lib/server/context';

/**
 * El editor de diseño: plantilla y ajustes, con la tienda al lado.
 *
 * Vive fuera de `(panel)` para ocupar la pantalla entera, así que no hereda
 * su `load`: pide `requireAdmin` por su cuenta, igual que la action.
 */
export const load: PageServerLoad = async (event) => {
	const { store } = await requireAdmin(event);

	return {
		settings: orFail(await getSettings(panelContext(event))),
		storeUrl: storeUrl(store.slug)
	};
};

const firstIssue = (issues: { message: string }[]) => issues.at(0)?.message ?? 'Revisa los datos.';

export const actions: Actions = {
	guardar: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const template = templateSchema.safeParse(formData.get('template'));

		if (!template.success) return fail(400, { error: firstIssue(template.error.issues) });

		const parsed = storeThemeSchema.safeParse({
			accent: formData.get('accent') ?? '',
			fonts: formData.get('fonts') ?? '',
			corners: formData.get('corners') ?? '',
			hero: formData.get('hero') ?? ''
		});

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const theme = parsed.data;

		// Se mide contra la plantilla que se guarda junto con el color.
		const problem = accentProblem(template.data, theme.accent ?? '');

		if (problem) return fail(400, { error: problem });

		const result = await updateSettings(ctx, {
			template: template.data,
			theme: isEmptyTheme(theme) ? null : theme
		});

		if (!result.ok) return failWith(result);

		return { message: 'Listo: tu tienda ya se ve así.' };
	}
};
