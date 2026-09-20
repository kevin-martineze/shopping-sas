import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { logout } from '$lib/server/api/auth';
import { clientAddress } from '$lib/server/context';
import { clearSession } from '$lib/server/session';

export const POST: RequestHandler = async (event) => {
	const { session } = event.locals;

	// Se revoca en la API para que el refresh token no sirva aunque alguien se
	// haya llevado la cookie. Si la API no responde, la sesión se cierra igual en
	// este navegador: quedarse adentro no es la alternativa.
	if (session) await logout(session.refreshToken, clientAddress(event));

	clearSession(event.cookies);
	redirect(303, '/admin/login');
};
