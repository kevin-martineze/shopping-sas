import type { Category, Color, ProductStatus, Size } from '$lib/domain/catalog';
import type { ApiResult } from '$lib/server/api/client';
import type { PanelContext } from '$lib/server/context';

import { z } from 'zod';

import { panelRequest, segment } from '$lib/server/api/request';
import { productStatusSchema, toApiProductStatus } from '$lib/server/api/statuses';

/** Catálogo del panel: colores, tallas, categorías, prendas, variantes, fotos e inventario. */

// ---------------------------------------------------------------------------
// Colores, tallas y categorías
// ---------------------------------------------------------------------------

const colorSchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		hex: z.string(),
		sortOrder: z.number(),
		active: z.boolean(),
		usageCount: z.number()
	})
	.transform((color): Color & { usage: number } => ({
		id: color.id,
		slug: color.slug,
		name: color.name,
		hex: color.hex,
		sort_order: color.sortOrder,
		active: color.active,
		usage: color.usageCount
	}));

const sizeSchema = z
	.object({
		id: z.string(),
		label: z.string(),
		sortOrder: z.number(),
		active: z.boolean(),
		usageCount: z.number()
	})
	.transform((size): Size & { usage: number } => ({
		id: size.id,
		label: size.label,
		sort_order: size.sortOrder,
		active: size.active,
		usage: size.usageCount
	}));

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

export interface ColorInput {
	name: string;
	hex: string;
	sortOrder: number;
	active: boolean;
}

export interface SizeInput {
	label: string;
	sortOrder: number;
	active: boolean;
}

export interface CategoryInput {
	name: string;
	sortOrder: number;
	active: boolean;
}

const hiddenQuery = (includeHidden: boolean) => (includeHidden ? '?includeHidden=true' : '');

export function listColors(ctx: PanelContext, includeHidden = false) {
	return panelRequest(ctx, `/colors${hiddenQuery(includeHidden)}`, z.array(colorSchema));
}

export function createColor(ctx: PanelContext, input: ColorInput) {
	return panelRequest(ctx, '/colors', colorSchema, { method: 'POST', body: input });
}

export function updateColor(ctx: PanelContext, id: string, input: ColorInput) {
	return panelRequest(ctx, `/colors/${segment(id)}`, colorSchema, { method: 'PATCH', body: input });
}

export function removeColor(ctx: PanelContext, id: string) {
	return panelRequest(ctx, `/colors/${segment(id)}`, removalSchema, { method: 'DELETE' });
}

export function listSizes(ctx: PanelContext, includeHidden = false) {
	return panelRequest(ctx, `/sizes${hiddenQuery(includeHidden)}`, z.array(sizeSchema));
}

export function createSize(ctx: PanelContext, input: SizeInput) {
	return panelRequest(ctx, '/sizes', sizeSchema, { method: 'POST', body: input });
}

export function updateSize(ctx: PanelContext, id: string, input: SizeInput) {
	return panelRequest(ctx, `/sizes/${segment(id)}`, sizeSchema, { method: 'PATCH', body: input });
}

export function removeSize(ctx: PanelContext, id: string) {
	return panelRequest(ctx, `/sizes/${segment(id)}`, removalSchema, { method: 'DELETE' });
}

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
		? `${noun} está en uso, así que se ocultó en vez de borrarse. Los pedidos y prendas que ya lo tenían no cambian.`
		: `${noun} se borró.`;
}

// ---------------------------------------------------------------------------
// Prendas
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
		color: z.object({ id: z.string(), name: z.string(), hex: z.string() }),
		size: z.object({ id: z.string(), label: z.string(), sortOrder: z.number() })
	})
	.transform((variant) => ({
		id: variant.id,
		sku: variant.sku,
		stock: variant.stock,
		price_override: variant.priceOverride,
		active: variant.active,
		color_id: variant.color.id,
		size_id: variant.size.id,
		colors: variant.color,
		sizes: { id: variant.size.id, label: variant.size.label, sort_order: variant.size.sortOrder }
	}));

const detailSchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		material: z.string().nullable(),
		care: z.string().nullable(),
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
				colorId: z.string().nullable(),
				storagePath: z.string(),
				urlThumb: z.string(),
				urlCard: z.string(),
				sortOrder: z.number(),
				alt: z.string().nullable()
			})
		),
		variants: z.array(variantSchema)
	})
	.transform((product) => ({
		id: product.id,
		slug: product.slug,
		name: product.name,
		description: product.description,
		material: product.material,
		care: product.care,
		category_id: product.categoryId,
		base_price: product.basePrice,
		compare_at_price: product.compareAtPrice,
		status: product.status,
		featured: product.featured,
		created_at: product.createdAt,
		updated_at: product.updatedAt,
		product_images: product.images.map((image) => ({
			id: image.id,
			color_id: image.colorId,
			storage_path: image.storagePath,
			url_thumb: image.urlThumb,
			url_card: image.urlCard,
			sort_order: image.sortOrder,
			alt: image.alt
		})),
		variants: product.variants
	}));

export type AdminProductRow = z.output<typeof listItemSchema>;
export type AdminProductDetail = z.output<typeof detailSchema>;
export type AdminVariantRow = z.output<typeof variantSchema>;

export interface ProductInput {
	name: string;
	slug: string;
	description: string;
	material: string;
	care: string;
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
		material: input.material || null,
		care: input.care || null,
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

/** `archived`: estaba en pedidos. `storagePaths`: fotos que quedaron sin fila y hay que borrar. */
export function removeProduct(ctx: PanelContext, id: string) {
	return panelRequest(
		ctx,
		`/products/${segment(id)}`,
		z.object({ result: z.enum(['deleted', 'archived']), storagePaths: z.array(z.string()) }),
		{ method: 'DELETE' }
	);
}

// ---------------------------------------------------------------------------
// Variantes y fotos
// ---------------------------------------------------------------------------

export function generateVariants(
	ctx: PanelContext,
	productId: string,
	input: { colorIds: string[]; sizeIds: string[]; defaultStock: number }
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

export function addProductImage(
	ctx: PanelContext,
	productId: string,
	input: {
		storagePath: string;
		urlFull: string;
		urlCard: string;
		urlThumb: string;
		lqip: string | null;
		alt: string | null;
		colorId: string | null;
	}
) {
	return panelRequest(ctx, `/products/${segment(productId)}/images`, idSchema, {
		method: 'POST',
		body: input
	});
}

export function reorderProductImages(ctx: PanelContext, productId: string, imageIds: string[]) {
	return panelRequest(ctx, `/products/${segment(productId)}/images/order`, z.array(idSchema), {
		method: 'PUT',
		body: { imageIds }
	});
}

/** Devuelve la ruta del archivo, para borrarlo del almacenamiento. */
export function removeProductImage(ctx: PanelContext, imageId: string) {
	return panelRequest(
		ctx,
		`/product-images/${segment(imageId)}`,
		z.object({ storagePath: z.string() }),
		{ method: 'DELETE' }
	);
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
						colorName: z.string(),
						colorHex: z.string(),
						sizeLabel: z.string()
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
				colors: { name: variant.colorName, hex: variant.colorHex },
				sizes: { label: variant.sizeLabel }
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
