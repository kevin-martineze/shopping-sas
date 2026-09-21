/**
 * Qué sirve cada host: el sitio comercial de Globerce o una tienda.
 *
 * El dominio raíz (`globerce.store`, o `localhost` en desarrollo) es el sitio
 * que vende la plataforma; los subdominios son las tiendas de los clientes.
 * Como los dos viven en el mismo despliegue, hay que decidirlo por host antes
 * de enrutar.
 *
 * Función pura para probarla sin SvelteKit.
 */

/** Rutas del sitio comercial. Viven bajo `/inicio` y el dominio raíz las sirve desde `/`. */
export const MARKETING_HOME = '/inicio';

/**
 * Las demás páginas del sitio comercial. Se sirven tal cual en el dominio
 * raíz y no existen en el host de una tienda: `boutique.globerce.store` vende
 * ropa, no software.
 */
const MARKETING_PATHS = [MARKETING_HOME, '/terminos', '/privacidad', '/contacto'];

function isMarketingPath(pathname: string): boolean {
	return MARKETING_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/** Lo que el sitio comercial sirve además de la portada, en cualquier host. */
const SHARED_PATHS = ['/registro', '/admin', '/plataforma'];

export interface RerouteInput {
	pathname: string;
	/** La tienda que resuelve el host, o null si es el dominio raíz. */
	storeSlug: string | null;
}

/**
 * La ruta que se va a enrutar de verdad, o `undefined` para dejarla igual.
 *
 * - Dominio raíz: `/` muestra el sitio comercial.
 * - Host de una tienda: `/inicio` no existe; esa tienda no vende Globerce.
 */
export function rerouteForHost({ pathname, storeSlug }: RerouteInput): string | undefined {
	if (storeSlug === null) {
		return pathname === '/' ? MARKETING_HOME : undefined;
	}

	// En una tienda, las páginas del sitio comercial no tienen por qué existir.
	if (isMarketingPath(pathname)) {
		return '/no-existe';
	}

	return undefined;
}

/** Si un host de tienda debe responder esta ruta tal cual (panel, registro, consola). */
export function isSharedPath(pathname: string): boolean {
	return SHARED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
