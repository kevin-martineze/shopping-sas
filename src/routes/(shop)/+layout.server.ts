import { error } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';
import { getStorefront } from '$lib/server/api/storefront';
import { publicContext } from '$lib/server/context';
import { resolveTemplatePreview } from '$lib/server/template-preview';

export const load: LayoutServerLoad = async (event) => {
	const result = await getStorefront(publicContext(event));

	if (!result.ok) {
		if (result.status === 404) error(404, 'Esta tienda no existe.');
		error(503, result.message);
	}

	// Una plantilla en prueba viste esta visita y nada más: la de verdad sigue
	// en la API hasta que la dueña la elija en el panel.
	const preview = resolveTemplatePreview(event.url, event.cookies);
	const settings = preview.template
		? { ...result.data.settings, template: preview.template }
		: result.data.settings;

	return {
		...result.data,
		settings,
		previewTemplate: preview.announce ? preview.template : null
	};
};
