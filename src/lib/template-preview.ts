import type { StorefrontTemplate } from '$lib/domain/templates';
import type { StoreTheme } from '$lib/domain/theme';

/**
 * El contrato entre el panel y la tienda para probar una plantilla: qué
 * parámetros lleva la URL. Quién lo lee y guarda la cookie está en
 * `$lib/server/template-preview.ts`; esto es lo que también necesita el
 * panel para armar los enlaces, y por eso no vive en `server/`.
 */
export const PREVIEW_PARAM = 'plantilla';
/** `&solo=1`: solo esta petición, sin cookie ni aviso. Para la miniatura. */
export const PREVIEW_ONCE_PARAM = 'solo';
export const PREVIEW_EXIT = 'salir';

/**
 * Los ajustes en borrador, para la miniatura del panel mientras la dueña los
 * prueba. Solo valen con `&solo=1`: nunca se guardan en la cookie ni se
 * anuncian. Con `ajustes=1` la miniatura usa estos y no los guardados, así
 * que un ajuste que falta significa «el de la plantilla».
 */
export const THEME_PREVIEW_PARAM = 'ajustes';
export const THEME_PREVIEW_KEYS = {
	accent: 'color',
	fonts: 'letras',
	corners: 'esquinas',
	hero: 'portada'
} as const satisfies Record<keyof StoreTheme, string>;

/** La URL con que se abre una tienda vestida con `template`, para mirarla. */
export function previewUrl(storeUrl: string, template: StorefrontTemplate, once = false): string {
	const url = new URL(storeUrl);

	url.searchParams.set(PREVIEW_PARAM, template);
	if (once) url.searchParams.set(PREVIEW_ONCE_PARAM, '1');

	return url.toString();
}

/** La miniatura de la tienda con `template` y unos ajustes sin guardar. */
export function themePreviewUrl(
	storeUrl: string,
	template: StorefrontTemplate,
	theme: StoreTheme
): string {
	const url = new URL(previewUrl(storeUrl, template, true));

	url.searchParams.set(THEME_PREVIEW_PARAM, '1');

	const values: [string, string | null][] = [
		[THEME_PREVIEW_KEYS.accent, theme.accent],
		[THEME_PREVIEW_KEYS.fonts, theme.fonts],
		[THEME_PREVIEW_KEYS.corners, theme.corners],
		[THEME_PREVIEW_KEYS.hero, theme.hero]
	];

	for (const [param, value] of values) {
		if (value) url.searchParams.set(param, value);
	}

	return url.toString();
}

/** La URL que apaga la vista previa y vuelve a la portada de la tienda. */
export function exitPreviewUrl(): string {
	return `/?${PREVIEW_PARAM}=${PREVIEW_EXIT}`;
}
