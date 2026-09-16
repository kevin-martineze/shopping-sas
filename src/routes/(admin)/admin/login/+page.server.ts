import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { loginSchema } from '$lib/schemas/admin';
import { login, logout } from '$lib/server/api/auth';
import { clientAddress } from '$lib/server/context';
import { toAdminSession, writeSession } from '$lib/server/session';
import { safeRedirectTarget } from '$lib/utils/redirect';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.session) redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));

	return { notice: url.searchParams.get('error') };
};

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, url } = event;
		const formData = await request.formData();
		const parsed = loginSchema.safeParse({
			email: formData.get('email'),
			password: formData.get('password')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const ip = clientAddress(event);
		const result = await login(parsed.data.email, parsed.data.password, ip);

		if (!result.ok) {
			// Los 4xx (credenciales, cuenta bloqueada, demasiados intentos) traen
			// un mensaje ya escrito para la dueña. Lo demás es la red o nosotros.
			const status = result.status >= 400 && result.status < 500 ? result.status : 503;

			return fail(status, { error: result.message });
		}

		const session = toAdminSession(result.data);

		if (!session) {
			// La cuenta existe pero no es miembro de ninguna tienda. La sesión que
			// emitió la API no lleva a ningún panel: se cierra en vez de dejarla viva.
			await logout(result.data.refreshToken, ip);

			return fail(403, { error: 'Esta cuenta no tiene acceso al panel.' });
		}

		writeSession(cookies, session);

		redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
	}
};
