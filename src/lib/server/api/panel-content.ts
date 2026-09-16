import type { Collection, HomeHighlight, StoreSettings } from '$lib/domain/settings';
import type { ApiResult } from '$lib/server/api/client';
import type { PanelContext } from '$lib/server/context';

import { z } from 'zod';

import { panelRequest, segment } from '$lib/server/api/request';

/** Contenido del panel: ajustes, bloques de portada y colecciones. */

const settingsSchema = z
	.object({
		storeName: z.string(),
		whatsappPhone: z.string(),
		instagramUrl: z.string().nullable(),
		announcement: z.string().nullable(),
		freeShippingThreshold: z.number().nullable(),
		heroCollectionId: z.string().nullable(),
		heroTitle: z.string().nullable(),
		heroSubtitle: z.string().nullable()
	})
	.transform((settings): StoreSettings => ({
		store_name: settings.storeName,
		whatsapp_phone: settings.whatsappPhone,
		instagram_url: settings.instagramUrl,
		announcement: settings.announcement,
		free_shipping_threshold: settings.freeShippingThreshold,
		hero_collection_id: settings.heroCollectionId,
		hero_title: settings.heroTitle,
		hero_subtitle: settings.heroSubtitle
	}));

/** Lo que se cambia; lo que no viene, no se toca. En los opcionales, null o vacío lo quita. */
export interface SettingsPatch {
	storeName?: string;
	whatsappPhone?: string;
	instagramUrl?: string | null;
	announcement?: string | null;
	freeShippingThreshold?: number | null;
	heroCollectionId?: string | null;
	heroTitle?: string | null;
	heroSubtitle?: string | null;
}

export function getSettings(ctx: PanelContext): Promise<ApiResult<StoreSettings>> {
	return panelRequest(ctx, '/settings', settingsSchema);
}

export function updateSettings(
	ctx: PanelContext,
	patch: SettingsPatch
): Promise<ApiResult<StoreSettings>> {
	return panelRequest(ctx, '/settings', settingsSchema, { method: 'PATCH', body: patch });
}

// ---------------------------------------------------------------------------
// Bloques de portada
// ---------------------------------------------------------------------------

const highlightSchema = z
	.object({
		id: z.string(),
		eyebrow: z.string(),
		title: z.string(),
		body: z.string(),
		sortOrder: z.number(),
		active: z.boolean()
	})
	.transform((highlight): HomeHighlight => ({
		id: highlight.id,
		eyebrow: highlight.eyebrow,
		title: highlight.title,
		body: highlight.body,
		sort_order: highlight.sortOrder,
		active: highlight.active
	}));

export interface HighlightInput {
	eyebrow: string;
	title: string;
	body: string;
	sortOrder: number;
	active: boolean;
}

export function listHighlights(ctx: PanelContext): Promise<ApiResult<HomeHighlight[]>> {
	return panelRequest(ctx, '/home-highlights', z.array(highlightSchema));
}

export function createHighlight(ctx: PanelContext, input: HighlightInput) {
	return panelRequest(ctx, '/home-highlights', highlightSchema, { method: 'POST', body: input });
}

export function updateHighlight(ctx: PanelContext, id: string, input: HighlightInput) {
	return panelRequest(ctx, `/home-highlights/${segment(id)}`, highlightSchema, {
		method: 'PATCH',
		body: input
	});
}

export function removeHighlight(ctx: PanelContext, id: string) {
	return panelRequest(ctx, `/home-highlights/${segment(id)}`, z.undefined(), { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Colecciones
// ---------------------------------------------------------------------------

/** Prenda etiquetada en una colección, con la forma que ya pinta la pantalla de colecciones. */
export interface CollectionLink {
	collection_id: string;
	product_id: string;
	sort_order: number;
	hotspot_x: number | null;
	hotspot_y: number | null;
	products: { name: string } | null;
}

const collectionsSchema = z
	.array(
		z.object({
			id: z.string(),
			slug: z.string(),
			name: z.string(),
			description: z.string().nullable(),
			heroImageUrl: z.string().nullable(),
			heroStoragePath: z.string().nullable(),
			active: z.boolean(),
			sortOrder: z.number(),
			items: z.array(
				z.object({
					productId: z.string(),
					productName: z.string(),
					sortOrder: z.number(),
					hotspotX: z.number().nullable(),
					hotspotY: z.number().nullable()
				})
			)
		})
	)
	.transform((list) => {
		const collections: Collection[] = list.map((collection) => ({
			id: collection.id,
			slug: collection.slug,
			name: collection.name,
			description: collection.description,
			hero_image_url: collection.heroImageUrl,
			hero_storage_path: collection.heroStoragePath,
			active: collection.active,
			sort_order: collection.sortOrder
		}));

		const links: CollectionLink[] = list.flatMap((collection) =>
			collection.items.map((item) => ({
				collection_id: collection.id,
				product_id: item.productId,
				sort_order: item.sortOrder,
				hotspot_x: item.hotspotX,
				hotspot_y: item.hotspotY,
				products: { name: item.productName }
			}))
		);

		return { collections, links };
	});

export interface CollectionInput {
	name: string;
	slug: string;
	description: string | null;
	active: boolean;
	sortOrder: number;
}

export function listCollections(
	ctx: PanelContext
): Promise<ApiResult<z.output<typeof collectionsSchema>>> {
	return panelRequest(ctx, '/collections', collectionsSchema);
}

export function createCollection(ctx: PanelContext, input: CollectionInput) {
	return panelRequest(ctx, '/collections', z.object({ id: z.string() }), {
		method: 'POST',
		body: input
	});
}

/** La API convierte la foto, la guarda y borra la anterior. */
export function uploadCollectionHero(ctx: PanelContext, id: string, file: File) {
	const formData = new FormData();

	formData.set('file', file, file.name);

	return panelRequest(ctx, `/collections/${segment(id)}/hero`, z.object({ id: z.string() }), {
		method: 'PUT',
		formData
	});
}

/** Borra la colección y su foto. */
export function removeCollection(ctx: PanelContext, id: string) {
	return panelRequest(ctx, `/collections/${segment(id)}`, z.undefined(), { method: 'DELETE' });
}

export function setCollectionProduct(
	ctx: PanelContext,
	collectionId: string,
	productId: string,
	position: { hotspotX: number | null; hotspotY: number | null }
) {
	return panelRequest(
		ctx,
		`/collections/${segment(collectionId)}/products/${segment(productId)}`,
		z.object({ id: z.string() }),
		{ method: 'PUT', body: position }
	);
}

export function removeCollectionProduct(
	ctx: PanelContext,
	collectionId: string,
	productId: string
) {
	return panelRequest(
		ctx,
		`/collections/${segment(collectionId)}/products/${segment(productId)}`,
		z.undefined(),
		{ method: 'DELETE' }
	);
}
