import { z } from 'zod';

import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * Se valida en tiempo de ejecución (no de build) para que el proyecto arranque
 * y muestre un error legible cuando falta configuración, en vez de romper el
 * build con un stack trace de SvelteKit.
 *
 * Supabase ya solo guarda las fotos (Storage): los datos viven en la API.
 */
const schema = z.object({
	PUBLIC_SUPABASE_URL: z.string().url(),
	SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
	PUBLIC_SITE_URL: z.string().url(),
	/** API propia con su prefijo de versión (`http://127.0.0.1:3000/v1`). Se guarda sin barra final. */
	API_URL: z
		.string()
		.url()
		.transform((value) => value.replace(/\/+$/, '')),
	/** Cifra la cookie de sesión del panel. Cambiarlo cierra todas las sesiones abiertas. */
	SESSION_SECRET: z.string().min(32),
	/** Slug de la tienda que sirve este frontend en la API. Mismo formato que un subdominio. */
	STORE_SLUG: z.string().regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/)
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
	if (cached) return cached;

	const parsed = schema.safeParse({
		PUBLIC_SUPABASE_URL: publicEnv.PUBLIC_SUPABASE_URL,
		SUPABASE_SERVICE_ROLE_KEY: privateEnv.SUPABASE_SERVICE_ROLE_KEY,
		PUBLIC_SITE_URL: publicEnv.PUBLIC_SITE_URL,
		API_URL: privateEnv.API_URL,
		SESSION_SECRET: privateEnv.SESSION_SECRET,
		STORE_SLUG: privateEnv.STORE_SLUG
	});

	if (!parsed.success) {
		const missing = parsed.error.issues.map((issue) => issue.path.join('.')).join(', ');
		throw new Error(
			`Configuración incompleta (${missing}). Copia .env.example a .env y completa las variables.`
		);
	}

	cached = parsed.data;
	return cached;
}
