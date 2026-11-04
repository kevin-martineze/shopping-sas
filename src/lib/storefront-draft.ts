import type { StorefrontDraft } from '$lib/domain/preview';

import { DRAFT_READY, DRAFT_UPDATE } from '$lib/domain/preview';
import { readStorefrontDraftMessage } from '$lib/schemas/storefront-draft';

export type { StorefrontDraft };
export { DRAFT_READY, DRAFT_UPDATE };

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
 * Lo que llega se lee campo a campo en `$lib/schemas/storefront-draft`: nada
 * que no sea una plantilla, un ajuste o un contenido conocido llega a pintarse.
 */
export function draftMessage(draft: StorefrontDraft) {
	return {
		type: DRAFT_UPDATE,
		template: draft.template,
		theme: { ...draft.theme },
		content: draft.content,
		focus: draft.focus
	};
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
	return readStorefrontDraftMessage(data);
}
