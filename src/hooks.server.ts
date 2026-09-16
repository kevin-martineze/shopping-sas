import type { Handle } from '@sveltejs/kit';

import { clientAddress } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';
import { resolveSession } from '$lib/server/session';

export const handle: Handle = async ({ event, resolve }) => {
	// Valida la configuración en cada petición: si falta una variable, el error
	// dice cuál, en vez de aparecer más tarde como un fallo de la API.
	serverEnv();

	// Una sola vez por petición, antes de cualquier `load`: si hay que renovar
	// el token, la cookie queda actualizada antes de que alguien lo use.
	event.locals.session = await resolveSession(event.cookies, clientAddress(event));

	return resolve(event);
};
