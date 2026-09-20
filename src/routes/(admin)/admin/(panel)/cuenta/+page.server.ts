import { error, fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { changePasswordSchema } from '$lib/schemas/account';
import { changePassword, me, switchStore } from '$lib/server/api/auth';
import {
	accountContext,
	clientAddress,
	displayStatus,
	failWith,
	orFail,
	panelContext,
	storeUrl
} from '$lib/server/context';
import { toAdminSession, writeSession } from '$lib/server/session';

export const load: PageServerLoad = async (event) => {
	const ctx = panelContext(event);
	const account = orFail(await me(ctx.accessToken, clientAddress(event)));

	return {
		user: { email: account.user.email, full_name: account.user.fullName },
		activeStoreId: ctx.storeId,
		stores: account.stores.map((store) => ({ ...store, url: storeUrl(store.slug) }))
	};
};

export const actions: Actions = {
	contrasena: async (event) => {
		const ctx = accountContext(event);
		const session = event.locals.session;

		if (!session) redirect(303, '/admin/login');

		const formData = await event.request.formData();
		const parsed = changePasswordSchema.safeParse({
			currentPassword: formData.get('currentPassword'),
			password: formData.get('password'),
			confirm: formData.get('confirm')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const result = await changePassword(ctx, {
			currentPassword: parsed.data.currentPassword,
			newPassword: parsed.data.password,
			refreshToken: session.refreshToken
		});

		// Un 401 aquí es la contraseña actual equivocada, no una sesión vencida.
		if (!result.ok) return fail(displayStatus(result), { error: result.message });

		return { message: 'Contraseña cambiada. Cerramos tus otras sesiones.' };
	},

	cambiarTienda: async (event) => {
		const ctx = accountContext(event);
		const session = event.locals.session;

		if (!session) redirect(303, '/admin/login');

		const formData = await event.request.formData();
		const storeId = String(formData.get('storeId') ?? '');

		if (!storeId) error(400, 'Elige una tienda.');

		const result = await switchStore(ctx, storeId, session.refreshToken);

		if (!result.ok) return failWith(result);

		writeSession(event.cookies, toAdminSession(result.data));
		redirect(303, '/admin');
	}
};
