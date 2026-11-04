import type {
	DraftCategories,
	DraftContent,
	DraftCoupon,
	DraftHome,
	DraftSettings,
	DraftShipping,
	PreviewZone,
	StorefrontDraft
} from '$lib/domain/preview';
import type { Category } from '$lib/domain/catalog';
import type { StoreSettings } from '$lib/domain/settings';

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

	/** La parte del borrador que el módulo está editando, si hay. */
	get content(): DraftContent | null {
		return this.current?.content ?? null;
	}

	/** La zona que conviene resaltar para que la dueña vea dónde cae. */
	get focus(): PreviewZone | null {
		return this.current?.focus ?? null;
	}

	/** La portada en borrador, si el módulo que edita es Portada. */
	get home(): DraftHome | null {
		const content = this.content;

		return content?.kind === 'home' ? content : null;
	}

	/** Los ajustes en borrador, si el módulo que edita es Ajustes. */
	get settings(): DraftSettings | null {
		const content = this.content;

		return content?.kind === 'settings' ? content : null;
	}

	/** Las categorías en borrador, si el módulo que edita es Catálogos. */
	get categories(): DraftCategories | null {
		const content = this.content;

		return content?.kind === 'categories' ? content : null;
	}

	/** Las zonas de envío en borrador, si el módulo que edita es Envíos. */
	get shipping(): DraftShipping | null {
		const content = this.content;

		return content?.kind === 'shipping' ? content : null;
	}

	/** El cupón en borrador, si el módulo que edita es Cupones. */
	get coupon(): DraftCoupon | null {
		const content = this.content;

		return content?.kind === 'coupon' ? content : null;
	}

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

		const themed = { ...settings, template: this.current.template, theme: this.current.theme };
		const draft = this.settings;

		if (!draft) return themed;

		return {
			...themed,
			store_name: draft.storeName,
			whatsapp_phone: draft.whatsappPhone,
			instagram_url: draft.instagramUrl || null,
			announcement: draft.announcement || null,
			free_shipping_threshold: draft.freeShippingThreshold
		};
	}

	/**
	 * Las categorías que se pintan en el menú: las del borrador si hay, si no
	 * las guardadas. Solo las visibles, en el orden que la dueña definió.
	 */
	applyCategories(categories: Category[]): Category[] {
		const draft = this.categories;

		if (!draft) return categories;

		return draft.categories
			.filter((category) => category.active)
			.sort((a, b) => a.sortOrder - b.sortOrder)
			.map((category) => ({
				id: category.id,
				slug: category.slug,
				name: category.name,
				parent_id: null,
				sort_order: category.sortOrder,
				active: category.active
			}));
	}
}

export const storefrontDraft = new StorefrontDraftState();
