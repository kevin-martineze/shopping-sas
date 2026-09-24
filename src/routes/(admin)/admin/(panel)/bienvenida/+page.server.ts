import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { templateSchema } from '$lib/schemas/admin';
import { getSettings, updateSettings } from '$lib/server/api/panel-content';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const [settings, { storeSlug, storeUrl }] = await Promise.all([
		getSettings(panelContext(event)),
		event.parent()
	]);

	return { settings: orFail(settings), storeSlug, storeUrl };
};

export const actions: Actions = {
	plantilla: async (event) => {
		const formData = await event.request.formData();
		const parsed = templateSchema.safeParse(formData.get('template'));

		if (!parsed.success) return fail(400, { error: 'Elige una de las plantillas.' });

		const result = await updateSettings(panelContext(event), { template: parsed.data });

		if (!result.ok) return failWith(result);

		// La tienda viene en el `action` del form: las form actions no corren el
		// `load` del layout, así que acá no hay `parent()` de donde sacarla. El
		// panel solo pinta la bienvenida si coincide con la tienda de la sesión,
		// así que un valor cambiado a mano no muestra nada.
		const slug = event.url.searchParams.get('tienda') ?? '';

		// Elegida la plantilla, el onboarding terminó: al panel, con la
		// bienvenida que enseña dónde quedó la tienda.
		redirect(303, `/admin?bienvenida=${encodeURIComponent(slug)}`);
	}
};
