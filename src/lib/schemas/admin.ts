import { z } from 'zod';

import { HERO_LAYOUTS, STOREFRONT_TEMPLATES } from '$lib/domain/templates';
import { HEX_COLOR, THEME_CORNERS, THEME_FONTS } from '$lib/domain/theme';

/** Precios en pesos enteros: la administradora los escribe con o sin puntos. */
const price = z.coerce
	.number({ invalid_type_error: 'Escribe un precio válido.' })
	.int('El precio no lleva decimales.')
	.min(0, 'El precio no puede ser negativo.')
	.max(100_000_000, 'Ese precio parece un error.');

export const loginSchema = z.object({
	email: z.string().trim().email('Correo inválido.'),
	password: z.string().min(8, 'La contraseña tiene mínimo 8 caracteres.')
});

export const productSchema = z
	.object({
		name: z.string().trim().min(2, 'Ponle nombre a el producto.').max(120),
		slug: z
			.string()
			.trim()
			.regex(/^[a-z0-9-]+$/, 'El slug solo admite minúsculas, números y guiones.')
			.max(80),
		description: z.string().trim().max(2000).optional().default(''),
		categoryId: z.string().uuid().nullable().optional(),
		basePrice: price,
		compareAtPrice: price.nullable().optional(),
		status: z.enum(['draft', 'active', 'archived']),
		featured: z.boolean().default(false)
	})
	.refine(
		(value) =>
			value.compareAtPrice === null ||
			value.compareAtPrice === undefined ||
			value.compareAtPrice === 0 ||
			value.compareAtPrice > value.basePrice,
		{
			message: 'El precio tachado debe ser mayor que el precio actual.',
			path: ['compareAtPrice']
		}
	);

/**
 * Generar las combinaciones que falten.
 *
 * Ya no se manda qué combinar: los ejes los declara el producto, y repetirlos
 * aquí obligaría a que dos fuentes coincidieran.
 */
export const variantMatrixSchema = z.object({
	productId: z.string().uuid(),
	defaultStock: z.coerce.number().int().min(0).max(9999).default(0)
});

/** Un eje del producto con sus valores. El hex solo cuando el valor es un color. */
export const productOptionsSchema = z.object({
	productId: z.string().uuid(),
	options: z
		.array(
			z.object({
				name: z.string().trim().min(1, 'Ponle nombre al eje.').max(40),
				values: z
					.array(
						z.object({
							value: z.string().trim().min(1, 'Cada valor necesita un nombre.').max(60),
							hex: z
								.string()
								.regex(/^#[0-9a-fA-F]{6}$/, 'El color va en formato #rrggbb.')
								.optional()
						})
					)
					.min(1, 'Un eje sin valores no divide nada.')
					.max(50)
			})
		)
		.max(3, 'Un producto admite hasta tres ejes.')
});

/** Los datos sueltos del producto: Material, ISBN, Origen… */
export const productAttributesSchema = z.object({
	productId: z.string().uuid(),
	attributes: z
		.array(
			z.object({
				name: z.string().trim().min(1, 'Ponle nombre al dato.').max(40),
				value: z.string().trim().min(1, 'El dato necesita un valor.').max(200)
			})
		)
		.max(20)
});

export const stockUpdateSchema = z.object({
	variantId: z.string().uuid(),
	stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo.').max(9999)
});

export const couponSchema = z
	.object({
		code: z
			.string()
			.trim()
			.toUpperCase()
			.regex(/^[A-Z0-9]{3,40}$/, 'Solo letras y números, entre 3 y 40 caracteres.'),
		type: z.enum(['percent', 'fixed']),
		value: z.coerce.number().int().min(1, 'El valor debe ser mayor que cero.'),
		minSubtotal: price.default(0),
		startsAt: z.string().optional().default(''),
		endsAt: z.string().optional().default(''),
		maxUses: z.coerce.number().int().min(1).nullable().optional(),
		active: z.boolean().default(true)
	})
	.refine((value) => value.type !== 'percent' || value.value <= 100, {
		message: 'Un porcentaje no puede pasar de 100.',
		path: ['value']
	});

export const shippingZoneSchema = z.object({
	name: z.string().trim().min(2, 'Ponle nombre a la zona.').max(80),
	cost: price,
	etaDays: z.coerce.number().int().min(0).max(60).nullable().optional(),
	active: z.boolean().default(true),
	sortOrder: z.coerce.number().int().min(0).max(999).default(0)
});

export const settingsSchema = z.object({
	storeName: z.string().trim().min(2, 'Escribe el nombre de la tienda.').max(80),
	whatsappPhone: z
		.string()
		.trim()
		.regex(/^[0-9]{10,15}$/, 'Escribe el número con indicativo y sin símbolos. Ej: 573001234567'),
	instagramUrl: z.string().trim().url('Escribe una URL válida.').or(z.literal('')).default(''),
	announcement: z.string().trim().max(160, 'Máximo 160 caracteres.').optional().default(''),
	freeShippingThreshold: price.nullable().optional()
});

export const collectionSchema = z.object({
	name: z.string().trim().min(2, 'Ponle nombre a la colección.').max(80),
	slug: z
		.string()
		.trim()
		.regex(/^[a-z0-9-]+$/, 'El slug solo admite minúsculas, números y guiones.')
		.max(80),
	description: z.string().trim().max(1000).optional().default(''),
	active: z.boolean().default(true),
	sortOrder: z.coerce.number().int().min(0).max(999).default(0)
});

export type ProductInput = z.infer<typeof productSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
export type ShippingZoneInput = z.infer<typeof shippingZoneSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type CollectionInput = z.infer<typeof collectionSchema>;

/** Categorías: cómo agrupa la tienda sus productos. */

export const categorySchema = z.object({
	name: z.string().trim().min(2, 'Ponle nombre a la categoría.').max(60),
	sortOrder: z.coerce.number().int().min(0).max(999).default(0),
	active: z.boolean().default(true)
});

/** Portada: hero y bloques de abajo. */

export const heroSchema = z.object({
	heroCollectionId: z.string().uuid().nullable().optional(),
	heroTitle: z.string().trim().max(120, 'Máximo 120 caracteres.').optional().default(''),
	heroSubtitle: z.string().trim().max(300, 'Máximo 300 caracteres.').optional().default('')
});

export const homeHighlightSchema = z.object({
	eyebrow: z.string().trim().min(2, 'Escribe la etiqueta.').max(40),
	title: z.string().trim().min(2, 'Escribe el título.').max(80),
	body: z.string().trim().min(2, 'Escribe el texto.').max(300),
	sortOrder: z.coerce.number().int().min(0).max(999).default(0),
	active: z.boolean().default(true)
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type HomeHighlightInput = z.infer<typeof homeHighlightSchema>;

/** La plantilla de la vitrina: solo una de las que este frontend sabe pintar. */
export const templateSchema = z.enum(STOREFRONT_TEMPLATES, {
	errorMap: () => ({ message: 'Elige una de las plantillas.' })
});

/** Un ajuste de lista cerrada: vacío es «el de la plantilla». */
function themeChoice<T extends string>(values: readonly [T, ...T[]], message: string) {
	return z
		.union([z.literal(''), z.enum(values, { errorMap: () => ({ message }) })])
		.transform((value) => (value === '' ? null : value));
}

/**
 * Los ajustes de la plantilla, tal como llegan del formulario. Que el color se
 * lea sobre la plantilla no se puede decir aquí —depende de cuál tenga la
 * tienda—: lo comprueba la action con `accentFits`.
 */
export const storeThemeSchema = z.object({
	accent: z
		.union([z.literal(''), z.string().regex(HEX_COLOR, 'El color va así: #1D4ED8.')])
		.transform((value) => (value === '' ? null : value.toUpperCase())),
	fonts: themeChoice(THEME_FONTS, 'Elige una de las letras.'),
	corners: themeChoice(THEME_CORNERS, 'Elige una de las esquinas.'),
	hero: themeChoice(HERO_LAYOUTS, 'Elige una de las portadas.')
});

/**
 * Las llaves de la pasarela de la tienda.
 *
 * Los prefijos los pone Wompi: comprobarlos acá evita el error más común —
 * pegar la pública donde va la privada— antes de gastar un viaje a la API.
 */
export const paymentKeysSchema = z.object({
	publicKey: z
		.string()
		.trim()
		.min(10, 'Pega tu llave pública.')
		.startsWith('pub_', 'La llave pública empieza por «pub_».'),
	privateKey: z
		.string()
		.trim()
		.min(10, 'Pega tu llave privada.')
		.startsWith('prv_', 'La llave privada empieza por «prv_».'),
	integritySecret: z.string().trim().min(10, 'Pega el secreto de integridad.'),
	eventsSecret: z.string().trim().min(10, 'Pega el secreto de eventos.')
});
