import type { Cookies } from '@sveltejs/kit';
import type { ApiSession } from '$lib/server/api/auth';
import type { AdminSession } from '$lib/server/session-crypto';

import { dev } from '$app/environment';

import { refresh } from '$lib/server/api/auth';
import { serverEnv } from '$lib/server/env';
import { needsRefresh, sealSession, unsealSession } from '$lib/server/session-crypto';

/** Sesión del panel en cookie. El formato del contenido está en `session-crypto.ts`. */

export const SESSION_COOKIE = 'tienda_session';

/** Lo mismo que `JWT_REFRESH_TTL` en la API: la cookie no dura más que el token que la respalda. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/** La sesión que guarda la cookie. Sin tienda activa solo sirve para la consola de la plataforma. */
export function toAdminSession(api: ApiSession, now: number = Date.now()): AdminSession {
	return {
		accessToken: api.accessToken,
		refreshToken: api.refreshToken,
		accessExpiresAt: now + api.expiresIn * 1000,
		userId: api.user.id,
		email: api.user.email,
		storeId: api.activeStoreId
	};
}

export function writeSession(cookies: Cookies, session: AdminSession): void {
	cookies.set(SESSION_COOKIE, sealSession(session, serverEnv().SESSION_SECRET), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: !dev,
		maxAge: COOKIE_MAX_AGE_SECONDS
	});
}

export function clearSession(cookies: Cookies): void {
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

/**
 * Lee la sesión de la cookie y la renueva si el access token está por vencer.
 *
 * Corre UNA vez por petición, en `hooks.server.ts`, y no en cada `load`: así
 * varios `load` en paralelo no refrescan cada uno por su lado, y la cookie ya
 * está actualizada antes de que alguien use el token.
 *
 * Qué pasa si la renovación falla depende de por qué:
 *
 * - La API rechazó el refresh token (revocado, vencido, reuso): la sesión se
 *   borra. Reintentar no lo va a arreglar; hay que volver a entrar.
 * - La API no respondió: la cookie se CONSERVA, porque el refresh token sigue
 *   siendo bueno y echar a la dueña por un corte ajeno sería peor. Pero la
 *   petición sigue sin sesión, porque el access token ya no sirve.
 */
export async function resolveSession(
	cookies: Cookies,
	clientIp: string | null
): Promise<AdminSession | null> {
	const sealed = cookies.get(SESSION_COOKIE);

	if (!sealed) return null;

	const session = unsealSession(sealed, serverEnv().SESSION_SECRET);

	if (!session) {
		clearSession(cookies);
		return null;
	}

	if (!needsRefresh(session, Date.now())) return session;

	const result = await refresh(session.refreshToken, clientIp);

	if (!result.ok) {
		if (result.status !== 0 && result.status < 500) clearSession(cookies);
		return null;
	}

	const renewed = toAdminSession(result.data);

	writeSession(cookies, renewed);

	return renewed;
}
