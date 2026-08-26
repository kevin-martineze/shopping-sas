import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { loginSchema } from '$lib/schemas/admin';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals, url }) => {
	const user = await locals.safeGetUser();

	if (user) redirect(303, url.searchParams.get('redirectTo') ?? '/admin');

	return { notice: url.searchParams.get('error') };
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const parsed = loginSchema.safeParse({
			email: formData.get('email'),
			password: formData.get('password')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const { data, error } = await locals.supabase.auth.signInWithPassword(parsed.data);

		if (error || !data.user) {
			return fail(400, { error: 'Correo o contraseña incorrectos.' });
		}

		// Tener cuenta no basta: hay que estar en `profiles` para entrar al panel.
		const { data: profile } = await supabaseAdmin()
			.from('profiles')
			.select('id')
			.eq('id', data.user.id)
			.maybeSingle<{ id: string }>();

		if (!profile) {
			await locals.supabase.auth.signOut();
			return fail(403, { error: 'Esta cuenta no tiene acceso al panel.' });
		}

		redirect(303, url.searchParams.get('redirectTo') ?? '/admin');
	}
};
