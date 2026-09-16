import type { RequestEvent } from '@sveltejs/kit';
import type { AdminSession } from '$lib/server/session-crypto';

import { error, redirect } from '@sveltejs/kit';

import { me } from '$lib/server/api/auth';
import { clientAddress } from '$lib/server/context';
import { clearSession } from '$lib/server/session';

/**
 * Exige sesión del panel y que la membresía en su tienda siga viva.
 *
 * La cookie sola no alcanza: prueba que la dueña entró, no que siga teniendo
 * acceso. Se le pregunta a la API en cada carga del panel —igual que antes se
 * consultaba `profiles`—, así quitarle el acceso a alguien surte efecto en la
 * siguiente página y no cuando venza su token.
 *
 * Guarda los `load`. Las form actions no pasan por aquí: usan `panelContext`.
 */
export async function requireAdmin(
	event: Pick<RequestEvent, 'locals' | 'cookies' | 'url' | 'getClientAddress'>
): Promise<AdminSession> {
	const { session } = event.locals;
	const loginUrl = `/admin/login?redirectTo=${encodeURIComponent(event.url.pathname)}`;

	if (!session) redirect(303, loginUrl);

	const result = await me(session.accessToken, clientAddress(event));

	if (!result.ok) {
		if (result.status === 401) {
			clearSession(event.cookies);
			redirect(303, loginUrl);
		}

		// La API no respondió o falló: no es motivo para cerrar la sesión.
		error(503, result.message);
	}

	if (!result.data.stores.some((store) => store.id === session.storeId)) {
		clearSession(event.cookies);
		redirect(303, '/admin/login?error=sin-permiso');
	}

	return session;
}
