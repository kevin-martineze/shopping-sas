import type { Category, ProductStatus } from '$lib/domain/catalog';
import type { ApiResult } from '$lib/server/api/client';
import type { PanelContext } from '$lib/server/context';

import { z } from 'zod';

import { panelRequest, segment } from '$lib/server/api/request';
import { productStatusSchema, toApiProductStatus } from '$lib/server/api/statuses';

/** Catálogo del panel: categorías, productos, sus ejes, variantes, fotos e inventario. */

// ---------------------------------------------------------------------------
// Ejes del producto y categorías
// ---------------------------------------------------------------------------

const optionValueSchema = z.object({
	id: z.string(),
	value: z.string(),
	hex: z.string().nullable(),
	sortOrder: z.number()
});

const optionSchema = z.object({
	id: z.string(),
	name: z.string(),
	sortOrder: z.number(),
	values: z.array(optionValueSchema)
});

const attributeSchema = z.object({
	id: z.string(),
	name: z.string(),
	value: z.string(),
	sortOrder: z.number()
});

export type ProductOption = z.output<typeof optionSchema>;
export type ProductOptionValue = z.output<typeof optionValueSchema>;
export type ProductAttribute = z.output<typeof attributeSchema>;

export interface OptionInput {
	name: string;
	values: { value: string; hex?: string }[];
}

export interface AttributeInput {
	name: string;
	value: string;
}

const categorySchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		parentId: z.string().nullable(),
		sortOrder: z.number(),
		active: z.boolean(),
		usageCount: z.number()
	})
	.transform((category): Category & { usage: number } => ({
		id: category.id,
		slug: category.slug,
		name: category.name,
		parent_id: category.parentId,
		sort_order: category.sortOrder,
		active: category.active,
		usage: category.usageCount
	}));

const removalSchema = z.object({ hidden: z.boolean() });

export interface CategoryInput {
	name: string;
	sortOrder: number;
	active: boolean;
}

const hiddenQuery = (includeHidden: boolean) => (includeHidden ? '?includeHidden=true' : '');

export function listCategories(ctx: PanelContext, includeHidden = false) {
	return panelRequest(ctx, `/categories${hiddenQuery(includeHidden)}`, z.array(categorySchema));
}

export function createCategory(ctx: PanelContext, input: CategoryInput) {
	return panelRequest(ctx, '/categories', categorySchema, { method: 'POST', body: input });
}

export function updateCategory(ctx: PanelContext, id: string, input: CategoryInput) {
	return panelRequest(ctx, `/categories/${segment(id)}`, categorySchema, {
		method: 'PATCH',
		body: input
	});
}

export function removeCategory(ctx: PanelContext, id: string) {
	return panelRequest(ctx, `/categories/${segment(id)}`, removalSchema, { method: 'DELETE' });
}

/** Traduce el resultado de quitar a un mensaje para la dueña. */
export function removalMessage(hidden: boolean, noun: string): string {
	return hidden
		? `${noun} está en uso, así que se ocultó en vez de borrarse. Los pedidos y productos que ya lo tenían no cambian.`
		: `${noun} se borró.`;
}

// ---------------------------------------------------------------------------
// Productos
// ---------------------------------------------------------------------------

const listItemSchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		status: productStatusSchema,
		basePrice: z.number(),
		category: z.object({ name: z.string() }).nullable(),
		totalStock: z.number(),
		thumbnailUrl: z.string().nullable()
	})
	.transform((product) => ({
		id: product.id,
		slug: product.slug,
		name: product.name,
		status: product.status,
		base_price: product.basePrice,
		category_name: product.category?.name ?? null,
		total_stock: product.totalStock,
		thumbnail_url: product.thumbnailUrl
	}));

const variantSchema = z
	.object({
		id: z.string(),
		sku: z.string().nullable(),
		stock: z.number(),
		priceOverride: z.number().nullable(),
		active: z.boolean(),
		label: z.string(),
		values: z.array(
			z.object({
				id: z.string(),
				optionId: z.string(),
				optionName: z.string(),
				value: z.string(),
				hex: z.string().nullable()
			})
		)
	})
	.transform((variant) => ({
		id: variant.id,
		sku: variant.sku,
		stock: variant.stock,
		price_override: variant.priceOverride,
		active: variant.active,
		/** "Rojo · M". Vacío si el producto no tiene ejes. */
		label: variant.label,
		values: variant.values,
		/** Los ids de sus valores, para casar la selección con la variante. */
		value_ids: variant.values.map((valor) => valor.id)
	}));

const detailSchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		categoryId: z.string().nullable(),
		basePrice: z.number(),
		compareAtPrice: z.number().nullable(),
		status: productStatusSchema,
		featured: z.boolean(),
		createdAt: z.string(),
		updatedAt: z.string(),
		images: z.array(
			z.object({
				id: z.string(),
				optionValueId: z.string().nullable(),
				storagePath: z.string(),
				urlThumb: z.string(),
				urlCard: z.string(),
				sortOrder: z.number(),
				alt: z.string().nullable()
			})
		),
		options: z.array(optionSchema),
		attributes: z.array(attributeSchema),
		variants: z.array(variantSchema)
	})
	.transform((product) => ({
		id: product.id,
		slug: product.slug,
		name: product.name,
		description: product.description,
		category_id: product.categoryId,
		base_price: product.basePrice,
		compare_at_price: product.compareAtPrice,
		status: product.status,
		featured: product.featured,
		created_at: product.createdAt,
		updated_at: product.updatedAt,
		product_images: product.images.map((image) => ({
			id: image.id,
			option_value_id: image.optionValueId,
			storage_path: image.storagePath,
			url_thumb: image.urlThumb,
			url_card: image.urlCard,
			sort_order: image.sortOrder,
			alt: image.alt
		})),
		options: product.options,
		attributes: product.attributes,
		variants: product.variants
	}));

export type AdminProductRow = z.output<typeof listItemSchema>;
export type AdminProductDetail = z.output<typeof detailSchema>;
export type AdminVariantRow = z.output<typeof variantSchema>;

export interface ProductInput {
	name: string;
	slug: string;
	description: string;
	categoryId: string | null;
	basePrice: number;
	compareAtPrice: number | null;
	status: ProductStatus;
	featured: boolean;
}

function productBody(input: ProductInput) {
	return {
		name: input.name,
		slug: input.slug,
		description: input.description || null,
		categoryId: input.categoryId,
		basePrice: input.basePrice,
		compareAtPrice: input.compareAtPrice || null,
		status: toApiProductStatus(input.status),
		featured: input.featured
	};
}

const idSchema = z.object({ id: z.string() });

export function listProducts(
	ctx: PanelContext,
	search: string | null
): Promise<ApiResult<AdminProductRow[]>> {
	const query = search ? `?${new URLSearchParams({ q: search.slice(0, 120) })}` : '';

	return panelRequest(ctx, `/products${query}`, z.array(listItemSchema));
}

export function getProduct(ctx: PanelContext, id: string): Promise<ApiResult<AdminProductDetail>> {
	return panelRequest(ctx, `/products/${segment(id)}`, detailSchema);
}

export function createProduct(ctx: PanelContext, input: ProductInput) {
	return panelRequest(ctx, '/products', idSchema, { method: 'POST', body: productBody(input) });
}

export function updateProduct(ctx: PanelContext, id: string, input: ProductInput) {
	return panelRequest(ctx, `/products/${segment(id)}`, idSchema, {
		method: 'PATCH',
		body: productBody(input)
	});
}

/** `archived`: estaba en pedidos. Si se borró, la API borra también sus fotos. */
export function removeProduct(ctx: PanelContext, id: string) {
	return panelRequest(
		ctx,
		`/products/${segment(id)}`,
		z.object({ result: z.enum(['deleted', 'archived']) }),
		{ method: 'DELETE' }
	);
}

// ---------------------------------------------------------------------------
// Variantes y fotos
// ---------------------------------------------------------------------------

/**
 * Crea las combinaciones que falten entre los ejes del producto.
 *
 * Qué combinar no viaja en la petición: sale de los ejes que el producto ya
 * declaró. Un producto sin ejes recibe igual su variante única.
 */
export function generateVariants(
	ctx: PanelContext,
	productId: string,
	input: { defaultStock: number }
) {
	return panelRequest(
		ctx,
		`/products/${segment(productId)}/variants`,
		z.object({ created: z.number() }),
		{
			method: 'POST',
			body: input
		}
	);
}

/**
 * Crea UNA combinación concreta, eligiendo un valor por eje.
 *
 * Es lo que `generateVariants` no cubre: la variación que solo existe en un color.
 */
export function createVariant(
	ctx: PanelContext,
	productId: string,
	input: { optionValueIds: string[]; stock?: number; priceOverride?: number | null }
) {
	return panelRequest(ctx, `/products/${segment(productId)}/variants/one`, idSchema, {
		method: 'POST',
		body: input
	});
}

/** Los ejes del producto, tal como están hoy. */
export function listProductOptions(ctx: PanelContext, productId: string) {
	return panelRequest(ctx, `/products/${segment(productId)}/options`, z.array(optionSchema));
}

/**
 * Deja los ejes del producto exactamente como vengan.
 *
 * Es declarativo —se manda la lista entera— porque la pantalla edita la lista
 * entera. Lo que se conserva se conserva por NOMBRE: si "Variación" sigue en la
 * lista, sus valores mantienen su id y con ellos las variantes que los usan.
 */
export function setProductOptions(ctx: PanelContext, productId: string, options: OptionInput[]) {
	return panelRequest(ctx, `/products/${segment(productId)}/options`, z.array(optionSchema), {
		method: 'PUT',
		body: { options }
	});
}

/** Los datos sueltos del producto: Material, ISBN, Origen… */
export function setProductAttributes(
	ctx: PanelContext,
	productId: string,
	attributes: AttributeInput[]
) {
	return panelRequest(ctx, `/products/${segment(productId)}/attributes`, z.array(attributeSchema), {
		method: 'PUT',
		body: { attributes }
	});
}

export function updateVariant(
	ctx: PanelContext,
	id: string,
	input: { stock?: number; priceOverride?: number | null; active?: boolean }
) {
	return panelRequest(ctx, `/variants/${segment(id)}`, idSchema, { method: 'PATCH', body: input });
}

/** `deactivated`: estaba en pedidos, así que quedó inactiva y en cero. */
export function removeVariant(ctx: PanelContext, id: string) {
	return panelRequest(
		ctx,
		`/variants/${segment(id)}`,
		z.object({ result: z.enum(['deleted', 'deactivated']) }),
		{ method: 'DELETE' }
	);
}

/** La API convierte la foto a WebP en tres tamaños y la guarda; va al final de la lista. */
export function uploadProductImage(
	ctx: PanelContext,
	productId: string,
	file: File,
	colorId: string | null
) {
	const formData = new FormData();

	formData.set('file', file, file.name);
	if (colorId) formData.set('colorId', colorId);

	return panelRequest(ctx, `/products/${segment(productId)}/images`, idSchema, {
		method: 'POST',
		formData
	});
}

export function reorderProductImages(ctx: PanelContext, productId: string, imageIds: string[]) {
	return panelRequest(ctx, `/products/${segment(productId)}/images/order`, z.array(idSchema), {
		method: 'PUT',
		body: { imageIds }
	});
}

/** Borra la fila y sus archivos. */
export function removeProductImage(ctx: PanelContext, imageId: string) {
	return panelRequest(ctx, `/product-images/${segment(imageId)}`, z.undefined(), {
		method: 'DELETE'
	});
}

// ---------------------------------------------------------------------------
// Inventario
// ---------------------------------------------------------------------------

const inventorySchema = z
	.object({
		groups: z.array(
			z.object({
				productId: z.string(),
				name: z.string(),
				slug: z.string(),
				variants: z.array(
					z.object({
						id: z.string(),
						sku: z.string().nullable(),
						stock: z.number(),
						active: z.boolean(),
						label: z.string(),
						hex: z.string().nullable()
					})
				)
			})
		)
	})
	.transform((inventory) =>
		inventory.groups.map((group) => ({
			id: group.productId,
			name: group.name,
			slug: group.slug,
			rows: group.variants.map((variant) => ({
				id: variant.id,
				sku: variant.sku,
				stock: variant.stock,
				active: variant.active,
				label: variant.label,
				hex: variant.hex
			}))
		}))
	);

export type InventoryGroup = z.output<typeof inventorySchema>[number];

export function listInventory(
	ctx: PanelContext,
	onlyLowStock: boolean
): Promise<ApiResult<InventoryGroup[]>> {
	return panelRequest(ctx, `/inventory${onlyLowStock ? '?lowStock=true' : ''}`, inventorySchema);
}
