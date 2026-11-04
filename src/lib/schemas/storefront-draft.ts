import { z } from 'zod';

import type { StorefrontDraft } from '$lib/domain/preview';

import { DRAFT_UPDATE, PREVIEW_ZONES } from '$lib/domain/preview';
import { STOREFRONT_TEMPLATES } from '$lib/domain/templates';
import { readUnknownTheme } from '$lib/domain/theme';

/**
 * El borrador que llega por `postMessage`, leído campo a campo.
 *
 * El mensaje viene de otra ventana, así que no se cree nada: cada campo se
 * valida con su forma y lo que no encaja se descarta. La plantilla es lo único
 * obligatorio —sin ella no hay tienda que vestir—; el contenido y la zona
 * enfocada son opcionales, porque un módulo puede mandar solo una parte.
 *
 * Un contenido mal formado se ignora entero: la tienda prefiere no resaltar
 * nada antes que pintar un borrador a medias.
 */
const blob = z.custom<Blob>((value) => typeof Blob !== 'undefined' && value instanceof Blob, {
	message: 'Se esperaba una foto.'
});

const highlightSchema = z.object({
	id: z.string(),
	eyebrow: z.string(),
	title: z.string(),
	body: z.string(),
	sortOrder: z.number(),
	active: z.boolean()
});

const homeSchema = z.object({
	kind: z.literal('home'),
	heroCollectionId: z.string().nullable(),
	heroTitle: z.string(),
	heroSubtitle: z.string(),
	highlights: z.array(highlightSchema)
});

const productSchema = z.object({
	kind: z.literal('product'),
	name: z.string(),
	slug: z.string(),
	description: z.string(),
	categoryId: z.string().nullable(),
	basePrice: z.number(),
	compareAtPrice: z.number().nullable(),
	status: z.enum(['draft', 'active', 'archived']),
	featured: z.boolean(),
	image: blob.nullable()
});

const collectionItemSchema = z.object({
	productId: z.string(),
	hotspotX: z.number().nullable(),
	hotspotY: z.number().nullable()
});

const collectionSchema = z.object({
	kind: z.literal('collection'),
	name: z.string(),
	slug: z.string(),
	description: z.string(),
	active: z.boolean(),
	image: blob.nullable(),
	items: z.array(collectionItemSchema)
});

const categorySchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	sortOrder: z.number(),
	active: z.boolean()
});

const categoriesSchema = z.object({
	kind: z.literal('categories'),
	categories: z.array(categorySchema)
});

const settingsSchema = z.object({
	kind: z.literal('settings'),
	storeName: z.string(),
	whatsappPhone: z.string(),
	instagramUrl: z.string(),
	announcement: z.string(),
	freeShippingThreshold: z.number().nullable()
});

const shippingZoneSchema = z.object({
	id: z.string(),
	name: z.string(),
	cost: z.number(),
	etaDays: z.number().nullable(),
	active: z.boolean()
});

const shippingSchema = z.object({
	kind: z.literal('shipping'),
	zones: z.array(shippingZoneSchema)
});

const couponSchema = z.object({
	kind: z.literal('coupon'),
	code: z.string(),
	type: z.enum(['percent', 'fixed']),
	value: z.number(),
	minSubtotal: z.number(),
	active: z.boolean()
});

const contentSchema = z.discriminatedUnion('kind', [
	homeSchema,
	productSchema,
	collectionSchema,
	categoriesSchema,
	settingsSchema,
	shippingSchema,
	couponSchema
]);

export const storefrontDraftMessageSchema = z.object({
	type: z.literal(DRAFT_UPDATE),
	template: z.enum(STOREFRONT_TEMPLATES),
	theme: z.unknown().transform((value) => readUnknownTheme(value)),
	content: contentSchema.nullable().optional().default(null).catch(null),
	focus: z.enum(PREVIEW_ZONES).nullable().optional().default(null).catch(null)
});

/** Lee el mensaje de un borrador; null si no es un borrador válido. */
export function readStorefrontDraftMessage(data: unknown): StorefrontDraft | null {
	const parsed = storefrontDraftMessageSchema.safeParse(data);

	if (!parsed.success) return null;

	return {
		template: parsed.data.template,
		theme: parsed.data.theme,
		content: parsed.data.content,
		focus: parsed.data.focus
	};
}
