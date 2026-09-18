import type { RequestEvent } from '@sveltejs/kit';
import type { ApiMe, ApiSessionStore } from '$lib/server/api/auth';
import type { AdminSession } from '$lib/server/session-crypto';

import { error, redirect } from '@sveltejs/kit';

import { me, switchStore } from '$lib/server/api/auth';
import { accountContext, clientAddress, storeSlugFor } from '$lib/server/context';
import { clearSession, toAdminSession, writeSession } from '$lib/server/session';

type GuardEvent = Pick<RequestEvent, 'locals' | 'cookies' | 'url' | 'getClientAddress'>;

export interface PanelAccess {
	account: ApiMe;
	/** La tienda activa, con el rol que la cuenta tiene en ella. */
	store: ApiSessionStore;
}

function loginUrl(event: GuardEvent): string {
	return `/admin/login?redirectTo=${encodeURIComponent(event.url.pathname)}`;
}

/** La cuenta de la sesión según la API, o redirige/falla si la sesión ya no sirve. */
async function currentAccount(event: GuardEvent, session: AdminSession): Promise<ApiMe> {
	const result = await me(session.accessToken, clientAddress(event));

	if (result.ok) return result.data;

	if (result.status === 401) {
		clearSession(event.cookies);
		redirect(303, loginUrl(event));
	}

	// La API no respondió o falló: no es motivo para cerrar la sesión.
	error(503, result.message);
}

/**
 * Exige sesión del panel y que la membresía en su tienda siga viva.
 *
 * La cookie sola no alcanza: prueba que la dueña entró, no que siga teniendo
 * acceso. Se le pregunta a la API en cada carga del panel, así quitarle el
 * acceso a alguien surte efecto en la siguiente página y no cuando venza su
 * token.
 *
 * Si el host es el de otra tienda de la misma cuenta, cambia la sesión a esa
 * tienda: en `boutique.globerce.com/admin` se administra `boutique`, aunque la
 * sesión viniera de otra.
 *
 * Guarda los `load`. Las form actions no pasan por aquí: usan `panelContext`.
 */
export async function requireAdmin(event: GuardEvent): Promise<PanelAccess> {
	const { session } = event.locals;

	if (!session) redirect(303, loginUrl(event));

	const account = await currentAccount(event, session);

	const hostSlug = storeSlugFor(event);
	const hostStore = account.stores.find((store) => store.slug === hostSlug);

	if (hostStore && hostStore.id !== session.storeId) {
		const switched = await switchStore(accountContext(event), hostStore.id, session.refreshToken);

		if (switched.ok) {
			writeSession(event.cookies, toAdminSession(switched.data));
			redirect(303, `${event.url.pathname}${event.url.search}`);
		}
	}

	if (!session.storeId) {
		if (account.isPlatformAdmin) redirect(303, '/plataforma');

		clearSession(event.cookies);
		redirect(303, '/admin/login?error=sin-permiso');
	}

	const store = account.stores.find((candidate) => candidate.id === session.storeId);

	if (!store) {
		clearSession(event.cookies);
		redirect(303, '/admin/login?error=sin-permiso');
	}

	return { account, store };
}

/** Exige una cuenta que administra la plataforma. */
export async function requirePlatformAdmin(event: GuardEvent): Promise<ApiMe> {
	const { session } = event.locals;

	if (!session) redirect(303, loginUrl(event));

	const account = await currentAccount(event, session);

	if (!account.isPlatformAdmin) error(403, 'Esta cuenta no administra la plataforma.');

	return account;
}
