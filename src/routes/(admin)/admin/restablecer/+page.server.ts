import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { resetPasswordSchema } from '$lib/schemas/account';
import { resetPassword } from '$lib/server/api/auth';
import { clientAddress, displayStatus } from '$lib/server/context';
import { clearSession } from '$lib/server/session';

export const load: PageServerLoad = ({ url }) => {
	return { token: url.searchParams.get('token') ?? '' };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const parsed = resetPasswordSchema.safeParse({
			token: formData.get('token'),
			password: formData.get('password'),
			confirm: formData.get('confirm')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const result = await resetPassword(
			parsed.data.token,
			parsed.data.password,
			clientAddress(event)
		);

		if (!result.ok) return fail(displayStatus(result), { error: result.message });

		// La API cerró todas las sesiones de la cuenta; la de este navegador también.
		clearSession(event.cookies);
		redirect(303, '/admin/login?aviso=restablecida');
	}
};
