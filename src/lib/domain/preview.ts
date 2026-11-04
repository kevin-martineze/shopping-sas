import type { StorefrontTemplate } from '$lib/domain/templates';
import type { StoreTheme } from '$lib/domain/theme';

/**
 * El contenido que el panel le manda a la tienda mientras la dueña escribe.
 *
 * Es un borrador, no un guardado: viaja por `postMessage` desde el formulario
 * de un módulo hasta la tienda que vive en el `iframe`, y nunca toca la API.
 * Cada módulo manda solo lo suyo, así que el contrato es una unión que se
 * distingue por `kind`. La tienda lee la parte que entiende y deja el resto
 * como está.
 *
 * Los nombres van en camelCase porque son los del panel; la tienda los traduce
 * a los tipos de dominio cuando los pinta. Los precios son enteros en pesos,
 * igual que en la API, y se muestran con `formatMoney` sin recalcular nada.
 */

/** La tienda avisa que ya escucha; el panel contesta con el borrador. */
export const DRAFT_READY = 'globerce:borrador-listo';
export const DRAFT_UPDATE = 'globerce:borrador';

export const DRAFT_CONTENT_KINDS = [
	'home',
	'product',
	'collection',
	'categories',
	'settings',
	'shipping',
	'coupon'
] as const;

export type DraftContentKind = (typeof DRAFT_CONTENT_KINDS)[number];

/**
 * Las zonas de la tienda que un módulo puede resaltar. Son las que cambian
 * cuando se edita algo: la portada, los bloques, la selección, el lookbook, la
 * cabecera de una colección, una ficha, el envío del carrito y el cupón.
 */
export const PREVIEW_ZONES = [
	'hero',
	'highlights',
	'featured',
	'lookbook',
	'collection-header',
	'product-card',
	'prodhipping',
	'cart-coupon'
] as const;

export type PreviewZone = (typeof PREVIEW_ZONES)[number];

/** Lo que dice la etiqueta que aparece sobre la zona resaltada. */
export const PREVIEW_ZONE_LABEL: Record<PreviewZone, string> = {
	hero: 'Aquí aparece tu portada',
	highlights: 'Aquí aparecen tus mensajes',
	featured: 'Aquí aparecen tus productos destacados',
	lookbook: 'Aquí aparecen tus colecciones',
	'collection-header': 'Aquí aparece tu colección',
	'product-card': 'Aquí se ve tu producto',
	prodhipping: 'Aquí se explica el envío',
	'cart-coupon': 'Aquí se aplica tu cupón'
};

export interface DraftHighlight {
	id: string;
	eyebrow: string;
	title: string;
	body: string;
	sortOrder: number;
	active: boolean;
}

export interface DraftHome {
	kind: 'home';
	heroCollectionId: string | null;
	heroTitle: string;
	heroSubtitle: string;
	highlights: DraftHighlight[];
}

export type DraftProductStatus = 'draft' | 'active' | 'archived';

export interface DraftProduct {
	kind: 'product';
	name: string;
	slug: string;
	description: string;
	categoryId: string | null;
	basePrice: number;
	compareAtPrice: number | null;
	status: DraftProductStatus;
	featured: boolean;
	/** La foto que la dueña acaba de elegir, si eligió una. */
	image: Blob | null;
}

export interface DraftCollectionItem {
	productId: string;
	hotspotX: number | null;
	hotspotY: number | null;
}

export interface DraftCollection {
	kind: 'collection';
	name: string;
	slug: string;
	description: string;
	active: boolean;
	image: Blob | null;
	items: DraftCollectionItem[];
}

export interface DraftCategory {
	id: string;
	name: string;
	slug: string;
	sortOrder: number;
	active: boolean;
}

export interface DraftCategories {
	kind: 'categories';
	categories: DraftCategory[];
}

export interface DraftSettings {
	kind: 'settings';
	storeName: string;
	whatsappPhone: string;
	instagramUrl: string;
	announcement: string;
	freeShippingThreshold: number | null;
}

export interface DraftShippingZone {
	id: string;
	name: string;
	cost: number;
	etaDays: number | null;
	active: boolean;
}

export interface DraftShipping {
	kind: 'shipping';
	zones: DraftShippingZone[];
}

export type DraftCouponType = 'percent' | 'fixed';

export interface DraftCoupon {
	kind: 'coupon';
	code: string;
	type: DraftCouponType;
	value: number;
	minSubtotal: number;
	active: boolean;
}

export type DraftContent =
	| DraftHome
	| DraftProduct
	| DraftCollection
	| DraftCategories
	| DraftSettings
	| DraftShipping
	| DraftCoupon;

/**
 * Lo que viaja del panel a la tienda en cada cambio.
 *
 * `content` es la parte que el módulo está editando —o `null` cuando solo
 * cambia el vestido— y `focus` es la zona que conviene resaltar para que la
 * dueña vea dónde cae lo que escribe.
 */
export interface StorefrontDraft {
	template: StorefrontTemplate;
	theme: StoreTheme;
	content: DraftContent | null;
	focus: PreviewZone | null;
}
