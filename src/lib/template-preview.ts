import type { StorefrontTemplate } from '$lib/domain/templates';

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

/** La URL con que se abre una tienda vestida con `template`, para mirarla. */
export function previewUrl(storeUrl: string, template: StorefrontTemplate, once = false): string {
	const url = new URL(storeUrl);

	url.searchParams.set(PREVIEW_PARAM, template);
	if (once) url.searchParams.set(PREVIEW_ONCE_PARAM, '1');

	return url.toString();
}

/** La URL que apaga la vista previa y vuelve a la portada de la tienda. */
export function exitPreviewUrl(): string {
	return `/?${PREVIEW_PARAM}=${PREVIEW_EXIT}`;
}
