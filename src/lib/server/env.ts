import { z } from 'zod';

import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * Se valida en tiempo de ejecución (no de build) para que el proyecto arranque
 * y muestre un error legible cuando falta configuración, en vez de romper el
 * build con un stack trace de SvelteKit.
 */
const schema = z.object({
	PUBLIC_SITE_URL: z.string().url(),
	/** API propia con su prefijo de versión (`http://127.0.0.1:3000/v1`). Se guarda sin barra final. */
	API_URL: z
		.string()
		.url()
		.transform((value) => value.replace(/\/+$/, '')),
	/** Cifra la cookie de sesión del panel. Cambiarlo cierra todas las sesiones abiertas. */
	SESSION_SECRET: z.string().min(32),
	/**
	 * Dominio bajo el que cada tienda es un subdominio: con `mitienda.com`,
	 * `boutique.mitienda.com` sirve la tienda `boutique`. Lleva el puerto si lo
	 * hay (`localhost:5173`). Sin él, el frontend sirve solo a `STORE_SLUG`.
	 */
	STORE_ROOT_DOMAIN: z
		.string()
		.regex(/^[a-z0-9.-]+(:\d+)?$/, 'STORE_ROOT_DOMAIN es un host, sin protocolo ni barras.')
		.optional()
		.transform((value) => value || undefined),
	/**
	 * Tienda que se sirve en el dominio raíz (o en cualquier host si no hay
	 * `STORE_ROOT_DOMAIN`). Sin ella, el dominio raíz lleva al registro.
	 */
	STORE_SLUG: z
		.string()
		.regex(/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/, 'STORE_SLUG tiene el formato de un subdominio.')
		.optional()
		.transform((value) => value || undefined)
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

export function serverEnv(): ServerEnv {
	if (cached) return cached;

	const parsed = schema.safeParse({
		PUBLIC_SITE_URL: publicEnv.PUBLIC_SITE_URL,
		API_URL: privateEnv.API_URL,
		SESSION_SECRET: privateEnv.SESSION_SECRET,
		STORE_ROOT_DOMAIN: privateEnv.STORE_ROOT_DOMAIN,
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
