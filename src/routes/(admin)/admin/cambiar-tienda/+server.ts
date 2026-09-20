import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { switchStore } from '$lib/server/api/auth';
import { accountContext } from '$lib/server/context';
import { toAdminSession, writeSession } from '$lib/server/session';

/**
 * Cambia la tienda que administra la sesión.
 *
 * Es un POST y no un enlace al subdominio de la otra tienda porque así funciona
 * también en desarrollo, donde la cookie no cruza subdominios, y porque cambiar
 * de tienda cambia el estado de la sesión: no es navegar.
 *
 * Quién puede entrar a qué lo decide la API: `switch-store` exige el refresh
 * token de esta sesión y comprueba la membresía. Un `storeId` cambiado a mano
 * no abre nada.
 */
export const POST: RequestHandler = async (event) => {
	const { session } = event.locals;

	if (!session) redirect(303, '/admin/login');

	const formData = await event.request.formData();
	const storeId = String(formData.get('storeId') ?? '');

	if (!storeId) redirect(303, '/admin');

	const result = await switchStore(accountContext(event), storeId, session.refreshToken);

	if (!result.ok) redirect(303, '/admin');

	writeSession(event.cookies, toAdminSession(result.data));
	redirect(303, '/admin');
};
