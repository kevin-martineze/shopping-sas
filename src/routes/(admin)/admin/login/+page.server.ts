import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { loginSchema } from '$lib/schemas/admin';
import { login, logout, me, switchStore } from '$lib/server/api/auth';
import { clientAddress, displayStatus, storeSlugFor } from '$lib/server/context';
import { toAdminSession, writeSession } from '$lib/server/session';
import { safeRedirectTarget } from '$lib/utils/redirect';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.session) redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));

	return { notice: url.searchParams.get('aviso') ?? url.searchParams.get('error') };
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
			return fail(displayStatus(result), { error: result.message });
		}

		let session = toAdminSession(result.data);

		// En el subdominio de una tienda se entra a ESA tienda, si la cuenta es
		// parte de ella, aunque la API haya elegido otra.
		const hostSlug = storeSlugFor(event);
		const hostStore = result.data.stores.find((store) => store.slug === hostSlug);

		if (hostStore && hostStore.id !== session.storeId) {
			const switched = await switchStore(
				{ accessToken: session.accessToken, clientIp: ip },
				hostStore.id,
				session.refreshToken
			);

			if (switched.ok) session = toAdminSession(switched.data);
		}

		if (!session.storeId) {
			// Sin tienda solo se entra a la consola de la plataforma.
			const account = await me(session.accessToken, ip);

			if (account.ok && account.data.isPlatformAdmin) {
				writeSession(cookies, session);
				redirect(303, '/plataforma');
			}

			await logout(session.refreshToken, ip);

			return fail(403, { error: 'Esta cuenta no tiene acceso al panel.' });
		}

		writeSession(cookies, session);

		redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
	}
};
