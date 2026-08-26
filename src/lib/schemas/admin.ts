import { z } from 'zod';

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
		name: z.string().trim().min(2, 'Ponle nombre a la prenda.').max(120),
		slug: z
			.string()
			.trim()
			.regex(/^[a-z0-9-]+$/, 'El slug solo admite minúsculas, números y guiones.')
			.max(80),
		description: z.string().trim().max(2000).optional().default(''),
		material: z.string().trim().max(200).optional().default(''),
		care: z.string().trim().max(400).optional().default(''),
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

export const variantMatrixSchema = z.object({
	productId: z.string().uuid(),
	colorIds: z.array(z.string().uuid()).min(1, 'Elige al menos un color.'),
	sizeIds: z.array(z.string().uuid()).min(1, 'Elige al menos una talla.'),
	defaultStock: z.coerce.number().int().min(0).max(9999).default(0)
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

/** Catálogos base: colores, tallas y categorías. */

export const colorSchema = z.object({
	name: z.string().trim().min(2, 'Ponle nombre al color.').max(40),
	hex: z
		.string()
		.trim()
		.regex(/^#[0-9a-fA-F]{6}$/, 'El tono debe ser un color en formato #RRGGBB.'),
	sortOrder: z.coerce.number().int().min(0).max(999).default(0),
	active: z.boolean().default(true)
});

export const sizeSchema = z.object({
	label: z
		.string()
		.trim()
		.min(1, 'Escribe la talla.')
		.max(12, 'Máximo 12 caracteres.')
		.transform((value) => value.toUpperCase()),
	sortOrder: z.coerce.number().int().min(0).max(999).default(0),
	active: z.boolean().default(true)
});

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

export type ColorInput = z.infer<typeof colorSchema>;
export type SizeInput = z.infer<typeof sizeSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type HomeHighlightInput = z.infer<typeof homeHighlightSchema>;
