import { z } from 'zod';

import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

/**
 * Se valida en tiempo de ejecución (no de build) para que el proyecto arranque
 * y muestre un error legible cuando falta configuración, en vez de romper el
 * build con un stack trace de SvelteKit.
 */

/**
 * Una variable opcional que además acepta estar vacía.
 *
 * En Vercel —y en cualquier `.env`— dejar un campo en blanco es la forma
 * natural de decir "esta no aplica". Sin esto, la cadena vacía llega al
 * validador, falla contra el formato y el sitio entero responde 500.
 */
function optional<T extends z.ZodTypeAny>(inner: T) {
	return z.preprocess((value) => (value === '' ? undefined : value), inner.optional());
}
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
	 * Secreto que la API exige para atender (cabecera `x-globerce-key`). Tiene
	 * que ser el mismo `API_SHARED_SECRET` de la API. Vacío en desarrollo, donde
	 * la API no lo pide.
	 */
	API_SHARED_SECRET: optional(z.string().min(32)),
	/**
	 * Dominio bajo el que cada tienda es un subdominio: con `mitienda.com`,
	 * `boutique.mitienda.com` sirve la tienda `boutique`. Lleva el puerto si lo
	 * hay (`localhost:5173`). Sin él, el frontend sirve solo a la tienda por
	 * defecto.
	 */
	PUBLIC_STORE_ROOT_DOMAIN: optional(
		z
			.string()
			.regex(
				/^[a-z0-9.-]+(:\d+)?$/,
				'PUBLIC_STORE_ROOT_DOMAIN es un host, sin protocolo ni barras.'
			)
	),
	/**
	 * Tienda que se sirve en el dominio raíz (o en cualquier host si no hay
	 * dominio raíz). Sin ella, el dominio raíz muestra el sitio comercial.
	 */
	PUBLIC_STORE_SLUG: optional(
		z
			.string()
			.regex(
				/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/,
				'PUBLIC_STORE_SLUG tiene el formato de un subdominio.'
			)
	),
	/**
	 * Tienda de ejemplo que el sitio comercial enseña. Sin ella no se ofrece:
	 * un enlace a una demo que no existe es peor que no tener demo.
	 */
	PUBLIC_DEMO_STORE_SLUG: optional(
		z
			.string()
			.regex(
				/^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/,
				'PUBLIC_DEMO_STORE_SLUG tiene el formato de un subdominio.'
			)
	)
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | null = null;

/** Solo para los tests: obliga a volver a leer y validar el entorno. */
export function resetServerEnv(): void {
	cached = null;
}

export function serverEnv(): ServerEnv {
	if (cached) return cached;

	const parsed = schema.safeParse({
		PUBLIC_SITE_URL: publicEnv.PUBLIC_SITE_URL,
		API_URL: privateEnv.API_URL,
		SESSION_SECRET: privateEnv.SESSION_SECRET,
		API_SHARED_SECRET: privateEnv.API_SHARED_SECRET,
		PUBLIC_STORE_ROOT_DOMAIN: publicEnv.PUBLIC_STORE_ROOT_DOMAIN,
		PUBLIC_STORE_SLUG: publicEnv.PUBLIC_STORE_SLUG,
		PUBLIC_DEMO_STORE_SLUG: publicEnv.PUBLIC_DEMO_STORE_SLUG
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
