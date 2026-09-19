import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { registerSchema } from '$lib/schemas/account';
import { createStore, register } from '$lib/server/api/auth';
import { accountContext, clientAddress, displayStatus } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';
import { toAdminSession, writeSession } from '$lib/server/session';

export const load: PageServerLoad = ({ locals }) => {
	const rootDomain = serverEnv().PUBLIC_STORE_ROOT_DOMAIN;

	return {
		// Con sesión se crea una tienda más para esa cuenta: no se piden sus datos.
		signedIn: locals.session !== null,
		addressSuffix: rootDomain ? `.${rootDomain}` : null
	};
};

const existingAccountSchema = registerSchema.innerType().pick({
	storeName: true,
	storeSlug: true,
	whatsappPhone: true
});

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, locals } = event;
		const formData = await request.formData();
		const ip = clientAddress(event);

		const fields = {
			storeName: formData.get('storeName'),
			storeSlug: formData.get('storeSlug'),
			whatsappPhone: String(formData.get('whatsappPhone') ?? ''),
			fullName: formData.get('fullName'),
			email: formData.get('email'),
			password: formData.get('password'),
			confirm: formData.get('confirm')
		};

		if (locals.session) {
			const parsed = existingAccountSchema.safeParse(fields);

			if (!parsed.success) {
				return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
			}

			const result = await createStore(
				accountContext(event),
				parsed.data,
				locals.session.refreshToken
			);

			if (!result.ok) return fail(displayStatus(result), { error: result.message });

			writeSession(cookies, toAdminSession(result.data));
			redirect(303, `/admin?bienvenida=${encodeURIComponent(parsed.data.storeSlug)}`);
		}

		const parsed = registerSchema.safeParse(fields);

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const input = {
			storeName: parsed.data.storeName,
			storeSlug: parsed.data.storeSlug,
			whatsappPhone: parsed.data.whatsappPhone,
			fullName: parsed.data.fullName,
			email: parsed.data.email,
			password: parsed.data.password
		};
		const result = await register(input, ip);

		if (!result.ok) return fail(displayStatus(result), { error: result.message });

		writeSession(cookies, toAdminSession(result.data));
		redirect(303, `/admin?bienvenida=${encodeURIComponent(input.storeSlug)}`);
	}
};
