import { z } from 'zod';

import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * Se valida en tiempo de ejecución (no de build) para que el proyecto arranque
 * y muestre un error legible cuando falta configuración, en vez de romper el
 * build con un stack trace de SvelteKit.
 */
const schema = z.object({
	PUBLIC_SUPABASE_URL: z.string().url(),
	PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
	PUBLIC_SITE_URL: z.string().url()
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
	if (cached) return cached;

	const parsed = schema.safeParse({
		PUBLIC_SUPABASE_URL: publicEnv.PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY: publicEnv.PUBLIC_SUPABASE_ANON_KEY,
		SUPABASE_SERVICE_ROLE_KEY: privateEnv.SUPABASE_SERVICE_ROLE_KEY,
		PUBLIC_SITE_URL: publicEnv.PUBLIC_SITE_URL
	});

	if (!parsed.success) {
		const missing = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
		throw new Error(
			`Configuración incompleta (${missing}). Copia .env.example a .env y completa las claves de Supabase.`
		);
	}

	cached = parsed.data;
	return cached;
}
