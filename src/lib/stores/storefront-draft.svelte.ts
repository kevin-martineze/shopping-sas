import type { StoreSettings } from '$lib/domain/settings';
import type { StorefrontDraft } from '$lib/storefront-draft';

import { browser } from '$app/environment';

import { DRAFT_READY, readDraftMessage } from '$lib/storefront-draft';

/**
 * El borrador del editor de diseño, del lado de la tienda.
 *
 * Vive fuera de los componentes a propósito: dentro del `iframe` la clienta de
 * prueba puede navegar de la portada a un producto, y el borrador tiene que
 * seguir puesto aunque la URL ya no traiga `?ajustes=1`. Por eso, una vez que
 * se empieza a escuchar, se escucha hasta que la página se cierre.
 */
class StorefrontDraftState {
	current = $state<StorefrontDraft | null>(null);

	#listening = false;

	/** Empieza a escuchar al editor que contiene esta tienda. Idempotente. */
	listen() {
		if (!browser || this.#listening || window.parent === window) return;

		this.#listening = true;

		window.addEventListener('message', (event) => {
			// Solo la ventana que contiene a la tienda puede vestirla.
			if (event.source !== window.parent) return;

			const draft = readDraftMessage(event.data);

			if (draft) this.current = draft;
		});

		// El aviso no lleva nada de la tienda: da igual quién lo reciba.
		window.parent.postMessage({ type: DRAFT_READY }, '*');
	}

	/** Los ajustes con que se pinta: los del borrador si hay, si no los guardados. */
	apply(settings: StoreSettings): StoreSettings {
		if (!this.current) return settings;

		return { ...settings, template: this.current.template, theme: this.current.theme };
	}
}

export const storefrontDraft = new StorefrontDraftState();
