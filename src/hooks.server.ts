import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';

import { serverEnv } from '$lib/server/env';

export const handle: Handle = async ({ event, resolve }) => {
	const env = serverEnv();

	// Cliente ligado a las cookies de la petición: solo se usa para la sesión
	// de la administradora y para leer catálogo bajo RLS.
	event.locals.supabase = createServerClient(
		env.PUBLIC_SUPABASE_URL,
		env.PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					for (const { name, value, options } of cookiesToSet) {
						event.cookies.set(name, value, { ...options, path: '/' });
					}
				}
			}
		}
	);

	/**
	 * `getSession` no verifica el JWT. Se valida siempre contra el servidor de
	 * auth antes de confiar en el usuario.
	 */
	event.locals.safeGetUser = async () => {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) return null;
		return user;
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};
