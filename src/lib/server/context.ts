import type { RequestEvent } from '@sveltejs/kit';
import type { ApiFailure, ApiResult } from '$lib/server/api/client';

import { error, fail, redirect } from '@sveltejs/kit';

import { serverEnv } from '$lib/server/env';
import { storefrontUrl, storeSlugFromHost } from '$lib/tenant';

/** Con qué tienda y desde dónde habla la tienda pública con la API. */
export interface PublicContext {
	storeSlug: string;
	clientIp: string | null;
}

/** Con qué sesión habla el panel con la API. */
export interface PanelContext {
	storeId: string;
	accessToken: string;
	clientIp: string | null;
}

/** Sesión sin tienda: la cuenta y la consola de la plataforma. */
export interface AccountContext {
	accessToken: string;
	clientIp: string | null;
}

/** La IP de quien hizo la petición, o null si el adaptador no la sabe. */
export function clientAddress(event: Pick<RequestEvent, 'getClientAddress'>): string | null {
	try {
		return event.getClientAddress();
	} catch {
		return null;
	}
}

/** La tienda que sirve este host (subdominio o la de por defecto), o null si el host es el dominio raíz. */
export function storeSlugFor(event: Pick<RequestEvent, 'url'>): string | null {
	const env = serverEnv();

	return storeSlugFromHost(event.url.host, env.PUBLIC_STORE_ROOT_DOMAIN, env.PUBLIC_STORE_SLUG);
}

/** Dirección pública de una tienda, para los enlaces "ver tienda". */
export function storeUrl(slug: string): string {
	const env = serverEnv();

	return storefrontUrl(slug, env.PUBLIC_STORE_ROOT_DOMAIN, env.PUBLIC_SITE_URL);
}

/**
 * La tienda pública responde a la tienda del host: su subdominio bajo
 * `PUBLIC_STORE_ROOT_DOMAIN`, o la tienda por defecto en cualquier otro host.
 */
export function publicContext(
	event: Pick<RequestEvent, 'getClientAddress' | 'url'>
): PublicContext {
	const storeSlug = storeSlugFor(event);

	if (!storeSlug) error(404, 'Esta tienda no existe.');

	return { storeSlug, clientIp: clientAddress(event) };
}

function loginRedirect(event: Pick<RequestEvent, 'url'>): never {
	redirect(303, `/admin/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);
}

/**
 * Contexto del panel para loads Y form actions.
 *
 * Las form actions NO ejecutan el `load` del layout, así que no heredan su
 * `requireAdmin`. Sin este chequeo, un POST directo a una action llegaría sin
 * sesión. La API igual lo rechazaría con 401, pero así se manda al login en vez
 * de mostrar un error.
 */
export function panelContext(
	event: Pick<RequestEvent, 'locals' | 'url' | 'getClientAddress'>
): PanelContext {
	const { session } = event.locals;

	if (!session) loginRedirect(event);

	// Una sesión sin tienda solo la tiene quien administra la plataforma.
	if (!session.storeId) redirect(303, '/plataforma');

	return {
		storeId: session.storeId,
		accessToken: session.accessToken,
		clientIp: clientAddress(event)
	};
}

/** Contexto para lo que es de la cuenta y no de una tienda: contraseña, plataforma. */
export function accountContext(
	event: Pick<RequestEvent, 'locals' | 'url' | 'getClientAddress'>
): AccountContext {
	const { session } = event.locals;

	if (!session) loginRedirect(event);

	return { accessToken: session.accessToken, clientIp: clientAddress(event) };
}

/** Status HTTP para mostrar un fallo de la API: los 4xx se respetan, lo demás es 503. */
export function displayStatus(result: ApiFailure): number {
	return result.status >= 400 && result.status < 500 ? result.status : 503;
}

/** Dato imprescindible de un load del panel: sin él la página no puede pintarse. */
export function orFail<T>(result: ApiResult<T>): T {
	if (result.ok) return result.data;

	if (result.status === 401) redirect(303, '/admin/login');

	error(displayStatus(result), result.message);
}

/** Respuesta de una form action que falló en la API, con el mensaje que ya trae. */
export function failWith(result: ApiFailure) {
	if (result.status === 401) redirect(303, '/admin/login');

	return fail(displayStatus(result), { error: result.message });
}
