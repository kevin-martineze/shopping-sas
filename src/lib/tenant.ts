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

/**
 * Una variable vacía vale lo mismo que una ausente.
 *
 * Importa acá y no solo en la validación del entorno: este módulo también lo
 * usa el hook `reroute`, que lee `$env/dynamic/public` en crudo. Con la cadena
 * vacía colándose como "tienda por defecto", el dominio raíz se comportaba
 * como una tienda sin nombre y no encontraba nada.
 */
function limpiar(value: string | undefined): string | undefined {
	const trimmed = value?.trim().toLowerCase();

	return trimmed ? trimmed : undefined;
}

export function storeSlugFromHost(
	host: string,
	rootDomainRaw: string | undefined,
	fallbackRaw: string | undefined
): string | null {
	const normalized = host.trim().toLowerCase();
	const rootDomain = limpiar(rootDomainRaw);
	const fallback = limpiar(fallbackRaw);

	if (rootDomain) {
		const suffix = `.${rootDomain}`;

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
