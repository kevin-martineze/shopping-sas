import type { DomainStatus } from '$lib/domain/domain';

import { storefrontUrl } from '$lib/tenant';

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
