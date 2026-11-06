import { error, redirect } from '@sveltejs/kit';

import type { LayoutServerLoad } from './$types';
import { esVistaPrevia, redirectToCustomDomain } from '$lib/custom-domain';
import { getStorefront } from '$lib/server/api/storefront';
import { publicContext } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';
import { resolveTemplatePreview } from '$lib/server/template-preview';
import { parsePlatformHosts } from '$lib/tenant';

export const load: LayoutServerLoad = async (event) => {
	const result = await getStorefront(publicContext(event));

	if (!result.ok) {
		if (result.status === 404) error(404, 'Esta tienda no existe.');
		error(503, result.message);
	}

	// Una plantilla en prueba viste esta visita y nada más: la de verdad sigue
	// en la API hasta que la dueña la elija en el panel.
	const preview = resolveTemplatePreview(event.url, event.cookies);

	// Si la tienda ya tiene dominio propio activo, el subdominio le manda a él,
	// salvo en vistas previas: el panel las carga en un iframe del subdominio y
	// un salto a otro sitio rompe el borrador. Es un 302: si después se quita el
	// dominio, el subdominio vuelve a servir.
	const env = serverEnv();
	const moved = redirectToCustomDomain({
		currentHost: event.url.host,
		publicUrl: result.data.public_url,
		pathname: event.url.pathname,
		search: event.url.search,
		rootDomain: env.PUBLIC_STORE_ROOT_DOMAIN,
		platformHosts: parsePlatformHosts(env.PUBLIC_PLATFORM_HOSTS),
		skip: esVistaPrevia({
			secFetchDest: event.request.headers.get('sec-fetch-dest'),
			pathname: event.url.pathname,
			preview: preview.template !== null || preview.theme !== null
		})
	});

	if (moved) redirect(302, moved);

	const settings = {
		...result.data.settings,
		template: preview.template ?? result.data.settings.template,
		theme: preview.theme ?? result.data.settings.theme
	};

	return {
		...result.data,
		settings,
		previewTemplate: preview.announce ? preview.template : null,
		// Abierta por el editor de diseño: escucha el borrador que le mande.
		draftPreview: preview.theme !== null
	};
};
