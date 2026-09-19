import type { PageServerLoad } from './$types';
import { listPublicPlans } from '$lib/server/api/plans';
import { clientAddress, storeUrl } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';

export const load: PageServerLoad = async (event) => {
	const env = serverEnv();
	const plans = await listPublicPlans(clientAddress(event));

	return {
		// Si la API no responde, el sitio se muestra igual: una portada sin
		// precios vende menos que una portada, pero mucho más que un error.
		plans: plans.ok ? plans.data : [],
		signedIn: event.locals.session !== null,
		// Absoluta: las tarjetas de WhatsApp y las redes no resuelven rutas.
		siteUrl: env.PUBLIC_SITE_URL.replace(/\/+$/, ''),
		// Enseñar una tienda de verdad convence más que describirla.
		demoUrl: env.PUBLIC_DEMO_STORE_SLUG ? storeUrl(env.PUBLIC_DEMO_STORE_SLUG) : null
	};
};
