/**
 * Qué tienda sirve un host.
 *
 * Función pura para probarla sin SvelteKit. Con dominio raíz, cada tienda es
 * un subdominio de un solo nivel (`boutique.mitienda.com`); el dominio raíz y
 * cualquier otro host caen en la tienda por defecto, si la hay.
 */

const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

/** Subdominios que nunca son una tienda. */
const RESERVED = new Set(['www', 'app', 'api', 'admin', 'panel', 'plataforma']);

export function storeSlugFromHost(
	host: string,
	rootDomain: string | undefined,
	fallback: string | undefined
): string | null {
	const normalized = host.trim().toLowerCase();

	if (rootDomain) {
		const suffix = `.${rootDomain.toLowerCase()}`;

		if (normalized.endsWith(suffix)) {
			const label = normalized.slice(0, -suffix.length);

			if (SLUG.test(label) && !RESERVED.has(label)) return label;
		}
	}

	return fallback ?? null;
}

/**
 * Dirección pública de una tienda, para enlazarla desde el panel o el registro.
 * Sin dominio raíz, todas las tiendas viven en el mismo host.
 */
export function storefrontUrl(
	slug: string,
	rootDomain: string | undefined,
	siteUrl: string
): string {
	if (!rootDomain) return siteUrl.replace(/\/+$/, '');

	const protocol = new URL(siteUrl).protocol;

	return `${protocol}//${slug}.${rootDomain}`;
}
