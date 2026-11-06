import type { Reroute } from '@sveltejs/kit';

import { env } from '$env/dynamic/public';

import { rerouteForHost } from '$lib/marketing-host';
import { hostServesStore, parsePlatformHosts, resolveHost } from '$lib/tenant';

/**
 * Qué sirve cada host, antes de enrutar: el sitio que vende Globerce en el
 * dominio raíz, y la tienda de cada cliente en su subdominio. Las dos cosas
 * viven en el mismo despliegue y `/` no puede ser dos rutas a la vez.
 *
 * Va en los hooks universales y no en los del servidor porque SvelteKit solo
 * lee `reroute` de aquí, y porque al navegar dentro del sitio corre también en
 * el navegador. Por eso el dominio raíz y la tienda por defecto son variables
 * públicas: no hay secreto en decir qué host muestra qué.
 */
export const reroute: Reroute = ({ url }) => {
	const target = resolveHost(
		url.host,
		env.PUBLIC_STORE_ROOT_DOMAIN,
		parsePlatformHosts(env.PUBLIC_PLATFORM_HOSTS)
	);

	return rerouteForHost({
		pathname: url.pathname,
		isStore: hostServesStore(target, env.PUBLIC_STORE_SLUG)
	});
};
