import type { StorefrontTemplate } from '$lib/domain/templates';
import type { StoreTheme } from '$lib/domain/theme';

import { STOREFRONT_TEMPLATES } from '$lib/domain/templates';
import { readUnknownTheme } from '$lib/domain/theme';

/**
 * El contrato entre el editor de diseño del panel y la tienda que muestra.
 *
 * El editor tiene la tienda de verdad en un `iframe` y le manda el borrador
 * con `postMessage` en cada cambio, así la vista previa responde al instante
 * en vez de recargarse. La tienda solo escucha si se abrió como vista previa
 * de borrador (`?ajustes=1&solo=1`, ver `$lib/template-preview`) y solo a la
 * ventana que la contiene.
 *
 * 1. La tienda carga y avisa `READY` a quien la contiene.
 * 2. El editor contesta con el borrador (`UPDATE`), y lo vuelve a mandar con
 *    cada cambio.
 *
 * Lo que llega se lee campo a campo: nada que no sea una plantilla o un
 * ajuste conocido llega a pintarse.
 */
export const DRAFT_READY = 'globerce:borrador-listo';
export const DRAFT_UPDATE = 'globerce:borrador';

export interface StorefrontDraft {
	template: StorefrontTemplate;
	theme: StoreTheme;
}

export function draftMessage(draft: StorefrontDraft) {
	return { type: DRAFT_UPDATE, template: draft.template, theme: { ...draft.theme } };
}

function field(data: unknown, key: string): unknown {
	if (typeof data !== 'object' || data === null) return undefined;

	return new Map(Object.entries(data)).get(key);
}

export function isReadyMessage(data: unknown): boolean {
	return field(data, 'type') === DRAFT_READY;
}

/** El borrador de un mensaje, o null si el mensaje no es eso. */
export function readDraftMessage(data: unknown): StorefrontDraft | null {
	if (field(data, 'type') !== DRAFT_UPDATE) return null;

	const template = STOREFRONT_TEMPLATES.find((code) => code === field(data, 'template'));

	if (!template) return null;

	return { template, theme: readUnknownTheme(field(data, 'theme')) };
}
