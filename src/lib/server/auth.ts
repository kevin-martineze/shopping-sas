import type { User } from '@supabase/supabase-js';
import { redirect } from '@sveltejs/kit';

import { supabaseAdmin } from '$lib/server/supabase';

/**
 * Verifica la sesión contra el servidor de auth y comprueba que el usuario
 * tenga fila en `profiles`. Tener sesión no basta: hay que ser administradora.
 */
export async function requireAdmin(locals: App.Locals, pathname: string): Promise<User> {
	const user = await locals.safeGetUser();

	if (!user) {
		redirect(303, `/admin/login?redirectTo=${encodeURIComponent(pathname)}`);
	}

	const { data: profile } = await supabaseAdmin()
		.from('profiles')
		.select('id')
		.eq('id', user.id)
		.maybeSingle<{ id: string }>();

	if (!profile) {
		await locals.supabase.auth.signOut();
		redirect(303, '/admin/login?error=sin-permiso');
	}

	return user;
}
