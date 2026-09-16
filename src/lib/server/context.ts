import type { RequestEvent } from '@sveltejs/kit';
import type { ApiFailure, ApiResult } from '$lib/server/api/client';

import { error, fail, redirect } from '@sveltejs/kit';

import { serverEnv } from '$lib/server/env';

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

/** La IP de quien hizo la petición, o null si el adaptador no la sabe. */
export function clientAddress(event: Pick<RequestEvent, 'getClientAddress'>): string | null {
	try {
		return event.getClientAddress();
	} catch {
		return null;
	}
}

/**
 * La tienda pública responde a una sola tienda, la de `STORE_SLUG`.
 *
 * Es el paso intermedio antes de resolver la tienda por subdominio: la API ya es
 * multi-inquilino, el frontend todavía sirve a una.
 */
export function publicContext(event: Pick<RequestEvent, 'getClientAddress'>): PublicContext {
	return { storeSlug: serverEnv().STORE_SLUG, clientIp: clientAddress(event) };
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

	if (!session) {
		redirect(303, `/admin/login?redirectTo=${encodeURIComponent(event.url.pathname)}`);
	}

	return {
		storeId: session.storeId,
		accessToken: session.accessToken,
		clientIp: clientAddress(event)
	};
}

/** Status HTTP para mostrar un fallo de la API: los 4xx se respetan, lo demás es 503. */
function displayStatus(result: ApiFailure): number {
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
