/**
 * Qué es cada host: la plataforma, una tienda o un dominio propio.
 *
 * Función pura para probarla sin SvelteKit. Con dominio raíz, cada tienda es
 * un subdominio de un solo nivel (`boutique.mitienda.com`). Los hosts de la
 * plataforma (el raíz, `www`, `localhost`, `*.vercel.app`, los de
 * `PUBLIC_PLATFORM_HOSTS`) sirven el sitio comercial o la tienda por defecto.
 * Cualquier otro host es un dominio propio: su tienda se busca en la API.
 */

const SLUG = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

/**
 * Subdominios que nunca son una tienda.
 *
 * La misma lista está en `ecommerce-api/src/shared/tenancy/reserved-slugs.ts`,
 * que es quien impide registrarlos. Acá se ignoran aunque alguien los tenga de
 * antes: `www.globerce.store` es la plataforma, no una tienda.
 */
const RESERVED = new Set([
	'www',
	'app',
	'api',
	'admin',
	'panel',
	'plataforma',
	'mail',
	'correo',
	'media',
	'static',
	'assets',
	'cdn',
	'blog',
	'ayuda',
	'soporte',
	'status',
	'globerce'
]);

export type HostTarget =
	{ kind: 'platform' } | { kind: 'store'; slug: string } | { kind: 'custom'; host: string };

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

/**
 * Host en su forma canónica: minúsculas, sin puerto y sin punto final.
 * `Boutique.Localhost:5173.` → `boutique.localhost`.
 */
export function normalizeHost(host: string): string {
	return host.trim().toLowerCase().replace(/\.$/, '').replace(/:\d+$/, '');
}

function dominioRaiz(raw: string | undefined): string | undefined {
	const trimmed = raw?.trim();

	return trimmed ? normalizeHost(trimmed) || undefined : undefined;
}

/** `PUBLIC_PLATFORM_HOSTS`: hosts separados por comas. Vacío → ninguno. */
export function parsePlatformHosts(raw: string | undefined): string[] {
	return (raw ?? '')
		.split(',')
		.map((entry) => normalizeHost(entry))
		.filter((entry) => entry !== '');
}

/**
 * Qué es un host.
 *
 * - `store`: subdominio válido y no reservado de `rootDomain`.
 * - `platform`: el raíz, `www.<raíz>`, cualquier otro subdominio del raíz (los
 *   reservados), `localhost`, `*.localhost`, `*.vercel.app` y los de
 *   `platformHosts`.
 * - `custom`: cualquier otro host. Un dominio propio no cae en la tienda por
 *   defecto: se busca en la API.
 */
export function resolveHost(
	host: string,
	rootDomainRaw: string | undefined,
	platformHosts: readonly string[] = []
): HostTarget {
	const normalized = normalizeHost(host);
	const rootDomain = dominioRaiz(rootDomainRaw);

	if (rootDomain && normalized.endsWith(`.${rootDomain}`)) {
		const label = normalized.slice(0, -(rootDomain.length + 1));

		if (SLUG.test(label) && !RESERVED.has(label)) return { kind: 'store', slug: label };

		return { kind: 'platform' };
	}

	if (rootDomain && (normalized === rootDomain || normalized === `www.${rootDomain}`)) {
		return { kind: 'platform' };
	}

	if (normalized === 'localhost' || normalized.endsWith('.localhost')) return { kind: 'platform' };
	if (normalized === 'vercel.app' || normalized.endsWith('.vercel.app'))
		return { kind: 'platform' };
	if (platformHosts.some((entry) => normalizeHost(entry) === normalized))
		return { kind: 'platform' };

	return { kind: 'custom', host: normalized };
}

/**
 * Si el host sirve una tienda sin pasar por la API: un subdominio, o la
 * tienda por defecto en un host de la plataforma. Un dominio propio también
 * sirve tienda, pero su slug se busca después; aquí cuenta como `true`.
 */
export function hostServesStore(target: HostTarget, fallbackRaw: string | undefined): boolean {
	if (target.kind !== 'platform') return true;

	return limpiar(fallbackRaw) !== undefined;
}

/**
 * Slug de la tienda que sirve el host, o `null`. Un dominio propio da `null`:
 * su slug lo resuelve la API en `hooks.server.ts`, no esta función.
 */
export function storeSlugFromHost(
	host: string,
	rootDomainRaw: string | undefined,
	fallbackRaw: string | undefined,
	platformHosts: readonly string[] = []
): string | null {
	const target = resolveHost(host, rootDomainRaw, platformHosts);

	if (target.kind === 'store') return target.slug;
	if (target.kind === 'platform') return limpiar(fallbackRaw) ?? null;

	return null;
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

/**
 * El dominio con el que se emite la cookie de sesión, o `undefined` para que
 * valga solo en el host que la puso.
 *
 * El panel vive en el subdominio de cada tienda (`boutique.globerce.store/admin`)
 * y el registro en el dominio raíz. Con una cookie atada a un solo host, quien
 * se registra arriba tendría que volver a entrar al bajar a su tienda. Con el
 * punto delante, la sesión vale en todo el dominio.
 *
 * No se emite así en desarrollo: un dominio con puerto (`localhost:5173`) no es
 * un dominio válido para una cookie, y `localhost` a secas lo rechazan los
 * navegadores. Ahí la cookie sigue siendo del host, que es justo lo que se
 * quiere cuando todo corre en el mismo.
 */
export function sessionCookieDomain(rootDomainRaw: string | undefined): string | undefined {
	const rootDomain = limpiar(rootDomainRaw);

	if (!rootDomain || rootDomain.includes(':') || !rootDomain.includes('.')) return undefined;

	return `.${rootDomain}`;
}
