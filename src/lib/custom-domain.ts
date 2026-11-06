import type { DomainStatus } from '$lib/domain/domain';

import { resolveHost, storefrontUrl } from '$lib/tenant';

/**
 * Qué hacer con una petición a un dominio propio, antes de servir nada.
 *
 * - Rutas compartidas (panel, login, registro, consola): 308 al subdominio,
 *   siempre. Es el host canónico del panel y la redirección no cambia nunca.
 * - Tienda no activa (pendiente, fallida, desactivada): 302 al subdominio.
 *   Nunca 308: el navegador guarda un 308 para siempre, y si después se quita
 *   el dominio la visita entraría en bucle.
 * - Tienda activa en una ruta de la tienda: `null`, se sirve tal cual.
 *
 * Función pura: `hooks.server.ts` la llama con los datos de la API.
 */
export interface CustomDomainRedirect {
	status: 302 | 308;
	location: string;
}

export interface CustomDomainInput {
	slug: string;
	domainStatus: DomainStatus;
	pathname: string;
	search: string;
	isSharedPath: boolean;
	rootDomain: string | undefined;
	siteUrl: string;
}

export function customDomainRedirect({
	slug,
	domainStatus,
	pathname,
	search,
	isSharedPath,
	rootDomain,
	siteUrl
}: CustomDomainInput): CustomDomainRedirect | null {
	const shouldRedirect = isSharedPath || domainStatus !== 'active';

	if (!shouldRedirect) return null;

	return {
		status: isSharedPath ? 308 : 302,
		location: `${storefrontUrl(slug, rootDomain, siteUrl)}${pathname}${search}`
	};
}

/**
 * Un subdominio de tienda cuyo dominio propio ya está activo: a dónde mandar
 * la visita, o `null` si se queda. Solo para rutas de la tienda: el panel y el
 * registro no pasan por aquí.
 *
 * 302, nunca 308: la misma regla que en `customDomainRedirect`.
 */
export function redirectToCustomDomain({
	currentHost,
	publicUrl,
	pathname,
	search,
	rootDomain,
	platformHosts,
	skip = false
}: {
	currentHost: string;
	publicUrl: string;
	pathname: string;
	search: string;
	rootDomain: string | undefined;
	platformHosts: readonly string[];
	/** Si la visita no debe moverse (vista previa o iframe). Ver `esVistaPrevia`. */
	skip?: boolean;
}): string | null {
	if (skip) return null;
	if (resolveHost(currentHost, rootDomain, platformHosts).kind !== 'store') return null;

	const destination = resolveHost(new URL(publicUrl).host, rootDomain, platformHosts);

	if (destination.kind !== 'custom') return null;

	return `${publicUrl.replace(/\/+$/, '')}${pathname}${search}`;
}

/**
 * Una visita que no debe moverse al dominio propio: la vista previa del panel
 * (iframe de otro sitio sin cookies) o una plantilla o tema en prueba. Si se
 * moviera, el borrador se mandaría a un origen que el panel no espera y el
 * navegador lo descartaría en silencio.
 */
export function esVistaPrevia({
	secFetchDest,
	pathname,
	preview
}: {
	secFetchDest: string | null;
	pathname: string;
	preview: boolean;
}): boolean {
	return (
		secFetchDest === 'iframe' ||
		pathname === '/vista-previa' ||
		pathname.startsWith('/vista-previa/') ||
		preview
	);
}
