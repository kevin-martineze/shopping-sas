import type { Cookies } from '@sveltejs/kit';
import type { StorefrontTemplate } from '$lib/domain/templates';

import { dev } from '$app/environment';

import { STOREFRONT_TEMPLATES } from '$lib/domain/templates';
import { PREVIEW_EXIT, PREVIEW_ONCE_PARAM, PREVIEW_PARAM } from '$lib/template-preview';

/**
 * Probar una plantilla en la tienda de verdad, sin guardarla.
 *
 * `?plantilla=<código>` viste la vitrina con esa plantilla para quien la
 * abre y lo deja en una cookie de este host, así la vista previa sobrevive a
 * pasar de la portada a un producto y al carrito. `?plantilla=salir` la
 * apaga. Con `&solo=1` no se guarda nada: es lo que usa el panel para pintar
 * la miniatura de cada plantilla dentro de un `iframe`, y ahí tampoco se
 * anuncia la vista previa.
 *
 * No pide sesión a propósito: mirar una tienda con otro vestido no cambia
 * nada ni revela nada, y así la dueña puede mandarle el enlace a alguien
 * para que opine. Lo que sí cambia la plantilla —la action del panel— sigue
 * detrás de `panelContext`.
 */
const PREVIEW_COOKIE = 'globerce_plantilla';
const PREVIEW_MAX_AGE_SECONDS = 60 * 60;

export interface TemplatePreview {
	/** La plantilla que se está probando, o null si se ve la de verdad. */
	template: StorefrontTemplate | null;
	/** Si hay que decirle a quien mira que esto es una prueba. */
	announce: boolean;
}

function isTemplate(value: string | null): value is StorefrontTemplate {
	return value !== null && (STOREFRONT_TEMPLATES as readonly string[]).includes(value);
}

/** Sin `domain`: la cookie vale solo en el host de esta tienda. */
function cookieOptions() {
	return { path: '/', httpOnly: true, sameSite: 'lax', secure: !dev } as const;
}

export function resolveTemplatePreview(
	url: URL,
	cookies: Pick<Cookies, 'get' | 'set' | 'delete'>
): TemplatePreview {
	const pedida = url.searchParams.get(PREVIEW_PARAM);

	if (pedida === PREVIEW_EXIT) {
		cookies.delete(PREVIEW_COOKIE, cookieOptions());

		return { template: null, announce: false };
	}

	if (isTemplate(pedida)) {
		if (url.searchParams.get(PREVIEW_ONCE_PARAM) === '1') {
			return { template: pedida, announce: false };
		}

		cookies.set(PREVIEW_COOKIE, pedida, {
			...cookieOptions(),
			maxAge: PREVIEW_MAX_AGE_SECONDS
		});

		return { template: pedida, announce: true };
	}

	const guardada = cookies.get(PREVIEW_COOKIE) ?? null;

	if (isTemplate(guardada)) return { template: guardada, announce: true };

	return { template: null, announce: false };
}
