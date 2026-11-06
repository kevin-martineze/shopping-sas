import type { Handle, RequestEvent } from '@sveltejs/kit';
import type { StoreByDomain } from '$lib/server/domain-cache';

import { redirect } from '@sveltejs/kit';

import { customDomainRedirect } from '$lib/custom-domain';
import { isSharedPath } from '$lib/marketing-host';
import { findStoreByDomain } from '$lib/server/api/storefront';
import { clientAddress } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';
import { getCachedDomain, setCachedDomain } from '$lib/server/domain-cache';
import { resolveSession } from '$lib/server/session';
import { parsePlatformHosts, resolveHost } from '$lib/tenant';

type DomainLookup = { ok: true; store: StoreByDomain | null } | { ok: false; message: string };

/**
 * Qué tienda sirve un dominio propio. `store: null` si el host no tiene tienda.
 *
 * Un 404 se guarda; un error de la API no se guarda y vuelve como `ok: false`.
 */
async function lookupCustomDomain(event: RequestEvent, host: string): Promise<DomainLookup> {
	const cached = getCachedDomain(host);

	if (cached !== undefined) return { ok: true, store: cached };

	const result = await findStoreByDomain(host, clientAddress(event));

	if (result.ok) {
		setCachedDomain(host, result.data);
		return { ok: true, store: result.data };
	}

	if (result.status === 404) {
		setCachedDomain(host, null);
		return { ok: true, store: null };
	}

	return { ok: false, message: result.message };
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
		const shared = isSharedPath(event.url.pathname);
		const lookup = await lookupCustomDomain(event, target.host);

		// No se lanza `error()` aquí: fuera de una ruta, SvelteKit responde con su
		// página genérica. Las rutas de la tienda lo leen de `locals` en `publicContext`
		// y muestran su `+error.svelte`. El panel nunca se sirve en un dominio propio,
		// así que ahí sí se responde directo.
		if (!lookup.ok) {
			if (shared) {
				return new Response(lookup.message, {
					status: 503,
					headers: { 'retry-after': '30' }
				});
			}

			event.locals.storeLookupError = lookup.message;
		} else if (!lookup.store) {
			if (shared) return new Response('Esta tienda no existe.', { status: 404 });
		} else {
			const moved = customDomainRedirect({
				slug: lookup.store.slug,
				domainStatus: lookup.store.status,
				pathname: event.url.pathname,
				search: event.url.search,
				isSharedPath: shared,
				rootDomain: env.PUBLIC_STORE_ROOT_DOMAIN,
				siteUrl: env.PUBLIC_SITE_URL
			});

			if (moved) redirect(moved.status, moved.location);

			event.locals.storeSlug = lookup.store.slug;
		}
	}

	// Una sola vez por petición, antes de cualquier `load`: si hay que renovar
	// el token, la cookie queda actualizada antes de que alguien lo use.
	event.locals.session = await resolveSession(event.cookies, clientAddress(event));

	return resolve(event);
};
