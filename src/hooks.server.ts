import type { Handle, RequestEvent } from '@sveltejs/kit';

import { error, redirect } from '@sveltejs/kit';

import { customDomainRedirect } from '$lib/custom-domain';
import { isSharedPath } from '$lib/marketing-host';
import { findStoreByDomain } from '$lib/server/api/storefront';
import { clientAddress } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';
import { getCachedDomain, setCachedDomain, type StoreByDomain } from '$lib/server/domain-cache';
import { resolveSession } from '$lib/server/session';
import { parsePlatformHosts, resolveHost } from '$lib/tenant';

/**
 * Qué tienda sirve un dominio propio. `null` si el host no tiene tienda.
 *
 * Un 404 se guarda; un error de la API no, y responde 503 con su mensaje.
 */
async function lookupCustomDomain(
	event: RequestEvent,
	host: string
): Promise<StoreByDomain | null> {
	const cached = getCachedDomain(host);

	if (cached !== undefined) return cached;

	const result = await findStoreByDomain(host, clientAddress(event));

	if (result.ok) {
		setCachedDomain(host, result.data);
		return result.data;
	}

	if (result.status === 404) {
		setCachedDomain(host, null);
		return null;
	}

	error(503, result.message);
}

export const handle: Handle = async ({ event, resolve }) => {
	// Valida la configuración en cada petición: si falta una variable, el error
	// dice cuál, en vez de aparecer más tarde como un fallo de la API.
	const env = serverEnv();

	const target = resolveHost(
		event.url.host,
		env.PUBLIC_STORE_ROOT_DOMAIN,
		parsePlatformHosts(env.PUBLIC_PLATFORM_HOSTS)
	);

	if (target.kind === 'custom') {
		const store = await lookupCustomDomain(event, target.host);

		if (!store) error(404, 'Esta tienda no existe.');

		const moved = customDomainRedirect({
			slug: store.slug,
			domainStatus: store.status,
			pathname: event.url.pathname,
			search: event.url.search,
			isSharedPath: isSharedPath(event.url.pathname),
			rootDomain: env.PUBLIC_STORE_ROOT_DOMAIN,
			siteUrl: env.PUBLIC_SITE_URL
		});

		if (moved) redirect(moved.status, moved.location);

		event.locals.storeSlug = store.slug;
	}

	// Una sola vez por petición, antes de cualquier `load`: si hay que renovar
	// el token, la cookie queda actualizada antes de que alguien lo use.
	event.locals.session = await resolveSession(event.cookies, clientAddress(event));

	return resolve(event);
};
