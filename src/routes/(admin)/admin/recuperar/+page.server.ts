import { fail } from '@sveltejs/kit';

import type { Actions } from './$types';
import { forgotPasswordSchema } from '$lib/schemas/account';
import { forgotPassword } from '$lib/server/api/auth';
import { clientAddress, displayStatus } from '$lib/server/context';

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa el correo.' });
		}

		const result = await forgotPassword(parsed.data.email, clientAddress(event));

		// Solo fallan el límite de intentos o la red: exista o no la cuenta, la
		// respuesta es la misma, para no revelar qué correos tienen cuenta.
		if (!result.ok) return fail(displayStatus(result), { error: result.message });

		return { sent: true, email: parsed.data.email };
	}
};
