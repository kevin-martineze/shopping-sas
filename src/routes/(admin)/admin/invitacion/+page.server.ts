import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { acceptExistingSchema, acceptNewSchema } from '$lib/schemas/account';
import { acceptInvitation, previewInvitation } from '$lib/server/api/auth';
import { clientAddress, displayStatus } from '$lib/server/context';
import { toAdminSession, writeSession } from '$lib/server/session';

export const load: PageServerLoad = async (event) => {
	const token = event.url.searchParams.get('token') ?? '';

	if (!token) return { token, invitation: null, problem: 'El enlace está incompleto.' };

	const result = await previewInvitation(token, clientAddress(event));

	if (!result.ok) return { token, invitation: null, problem: result.message };

	return { token, invitation: result.data, problem: null };
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const existing = formData.get('existing') === 'true';
		const ip = clientAddress(event);

		let input: { token: string; password: string; fullName?: string };

		if (existing) {
			const parsed = acceptExistingSchema.safeParse({
				token: formData.get('token'),
				password: formData.get('password')
			});

			if (!parsed.success) {
				return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
			}

			input = parsed.data;
		} else {
			const parsed = acceptNewSchema.safeParse({
				token: formData.get('token'),
				fullName: formData.get('fullName'),
				password: formData.get('password'),
				confirm: formData.get('confirm')
			});

			if (!parsed.success) {
				return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
			}

			input = {
				token: parsed.data.token,
				password: parsed.data.password,
				fullName: parsed.data.fullName
			};
		}

		const result = await acceptInvitation(input, ip);

		if (!result.ok) return fail(displayStatus(result), { error: result.message });

		writeSession(event.cookies, toAdminSession(result.data));
		redirect(303, '/admin');
	}
};
