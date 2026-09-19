import type {
	CatalogFacets,
	Category,
	Color,
	ProductCard,
	ProductDetail,
	ProductFilters,
	ProductSort,
	Size
} from '$lib/domain/catalog';
import type { Collection, HomeHighlight, StoreSettings } from '$lib/domain/settings';
import type { ApiResult } from '$lib/server/api/client';
import type { PublicContext } from '$lib/server/context';

import { z } from 'zod';

import { isProductSort } from '$lib/domain/catalog';
import { publicRequest, segment } from '$lib/server/api/request';
import { templateSchema } from '$lib/server/api/statuses';

/**
 * Tienda pública (`/public/:storeSlug/*` de la API).
 *
 * Cada esquema traduce la respuesta de la API a los tipos de dominio que ya
 * usan las páginas, así el cambio de Supabase a la API no toca los componentes.
 */

// ---------------------------------------------------------------------------
// Esquemas
// ---------------------------------------------------------------------------

const cardSchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		price: z.number(),
		compareAtPrice: z.number().nullable(),
		images: z.array(
			z.object({
				urlCard: z.string(),
				urlThumb: z.string(),
				lqip: z.string().nullable(),
				alt: z.string().nullable()
			})
		),
		colors: z.array(
			z.object({ id: z.string(), slug: z.string(), name: z.string(), hex: z.string() })
		),
		inStock: z.boolean()
	})
	.transform((card): ProductCard => ({
		id: card.id,
		slug: card.slug,
		name: card.name,
		price: card.price,
		compareAtPrice: card.compareAtPrice,
		images: card.images.map((image) => ({
			url_card: image.urlCard,
			url_thumb: image.urlThumb,
			lqip: image.lqip,
			alt: image.alt
		})),
		colors: card.colors,
		inStock: card.inStock
	}));

// La API pública solo devuelve lo visible: todo lo que llega está activo.
const categorySchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		parentId: z.string().nullable(),
		sortOrder: z.number()
	})
	.transform((category): Category => ({
		id: category.id,
		slug: category.slug,
		name: category.name,
		parent_id: category.parentId,
		sort_order: category.sortOrder,
		active: true
	}));

const colorSchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		hex: z.string(),
		sortOrder: z.number()
	})
	.transform((color): Color => ({
		id: color.id,
		slug: color.slug,
		name: color.name,
		hex: color.hex,
		sort_order: color.sortOrder,
		active: true
	}));

const sizeSchema = z
	.object({ id: z.string(), label: z.string(), sortOrder: z.number() })
	.transform((size): Size => ({
		id: size.id,
		label: size.label,
		sort_order: size.sortOrder,
		active: true
	}));

const collectionShape = {
	id: z.string(),
	slug: z.string(),
	name: z.string(),
	description: z.string().nullable(),
	heroImageUrl: z.string().nullable(),
	sortOrder: z.number()
};

function toCollection(collection: z.infer<z.ZodObject<typeof collectionShape>>): Collection {
	return {
		id: collection.id,
		slug: collection.slug,
		name: collection.name,
		description: collection.description,
		hero_image_url: collection.heroImageUrl,
		// La ruta del archivo es dato del panel; la tienda pública no la recibe.
		hero_storage_path: null,
		active: true,
		sort_order: collection.sortOrder
	};
}

const storefrontSchema = z
	.object({
		store: z.object({ name: z.string() }),
		settings: z.object({
			whatsappPhone: z.string(),
			instagramUrl: z.string().nullable(),
			announcement: z.string().nullable(),
			freeShippingThreshold: z.number().nullable(),
			heroCollectionId: z.string().nullable(),
			heroTitle: z.string().nullable(),
			heroSubtitle: z.string().nullable(),
			template: templateSchema
		}),
		categories: z.array(categorySchema),
		collections: z.array(z.object(collectionShape).transform(toCollection))
	})
	.transform((storefront) => {
		const settings: StoreSettings = {
			store_name: storefront.store.name,
			whatsapp_phone: storefront.settings.whatsappPhone,
			instagram_url: storefront.settings.instagramUrl,
			announcement: storefront.settings.announcement,
			free_shipping_threshold: storefront.settings.freeShippingThreshold,
			hero_collection_id: storefront.settings.heroCollectionId,
			hero_title: storefront.settings.heroTitle,
			hero_subtitle: storefront.settings.heroSubtitle,
			template: storefront.settings.template
		};

		return { settings, categories: storefront.categories, collections: storefront.collections };
	});

const homeSchema = z.object({
	featured: z.array(cardSchema),
	newest: z.array(cardSchema),
	highlights: z.array(
		z
			.object({
				id: z.string(),
				eyebrow: z.string(),
				title: z.string(),
				body: z.string(),
				sortOrder: z.number()
			})
			.transform((highlight): HomeHighlight => ({
				id: highlight.id,
				eyebrow: highlight.eyebrow,
				title: highlight.title,
				body: highlight.body,
				sort_order: highlight.sortOrder,
				active: true
			}))
	)
});

const pageSchema = z.object({
	products: z.array(cardSchema),
	total: z.number(),
	page: z.number(),
	pageCount: z.number()
});

const facetsSchema = z.object({
	categories: z.array(categorySchema),
	colors: z.array(colorSchema),
	sizes: z.array(sizeSchema),
	priceRange: z.object({ min: z.number(), max: z.number() })
});

const detailSchema = z
	.object({
		id: z.string(),
		slug: z.string(),
		name: z.string(),
		description: z.string().nullable(),
		material: z.string().nullable(),
		care: z.string().nullable(),
		basePrice: z.number(),
		compareAtPrice: z.number().nullable(),
		categoryName: z.string().nullable(),
		categorySlug: z.string().nullable(),
		images: z.array(
			z.object({
				id: z.string(),
				colorId: z.string().nullable(),
				urlFull: z.string(),
				urlCard: z.string(),
				urlThumb: z.string(),
				lqip: z.string().nullable(),
				alt: z.string().nullable(),
				sortOrder: z.number()
			})
		),
		colors: z.array(colorSchema),
		sizes: z.array(sizeSchema),
		variants: z.array(
			z.object({
				id: z.string(),
				colorId: z.string(),
				sizeId: z.string(),
				sku: z.string().nullable(),
				stock: z.number(),
				price: z.number()
			})
		)
	})
	.transform((product): ProductDetail => ({
		id: product.id,
		slug: product.slug,
		name: product.name,
		description: product.description,
		material: product.material,
		care: product.care,
		basePrice: product.basePrice,
		compareAtPrice: product.compareAtPrice,
		categoryName: product.categoryName,
		categorySlug: product.categorySlug,
		images: product.images.map((image) => ({
			id: image.id,
			color_id: image.colorId,
			url_full: image.urlFull,
			url_card: image.urlCard,
			url_thumb: image.urlThumb,
			lqip: image.lqip,
			alt: image.alt,
			sort_order: image.sortOrder
		})),
		colors: product.colors,
		sizes: product.sizes,
		variants: product.variants
	}));

const collectionDetailSchema = z
	.object({
		...collectionShape,
		items: z.array(
			z.object({
				hotspotX: z.number().nullable(),
				hotspotY: z.number().nullable(),
				product: cardSchema
			})
		)
	})
	.transform((collection) => ({ ...toCollection(collection), items: collection.items }));

const sitemapSchema = z.object({
	products: z.array(z.object({ slug: z.string(), updatedAt: z.string() })),
	collections: z.array(z.string()),
	categories: z.array(z.string())
});

export type Storefront = z.output<typeof storefrontSchema>;
export type ProductListResult = z.output<typeof pageSchema>;
export type CollectionDetail = z.output<typeof collectionDetailSchema>;
export type Sitemap = z.output<typeof sitemapSchema>;

// ---------------------------------------------------------------------------
// Filtros del listado
// ---------------------------------------------------------------------------

/** Mismo techo que la API: por encima, casi seguro sobra un cero. */
const MAX_PRICE = 100_000_000;

/** Lee los filtros desde la URL: son la fuente de verdad, no el estado local. */
export function parseFilters(url: URL): ProductFilters {
	const sortParam = url.searchParams.get('orden');
	const page = Math.floor(Number(url.searchParams.get('pagina') ?? '1'));
	const min = Math.floor(Number(url.searchParams.get('min') ?? ''));
	const max = Math.floor(Number(url.searchParams.get('max') ?? ''));

	// Se recorta a los límites que valida la API: un enlace manipulado muestra
	// un listado razonable en vez de un error.
	return {
		category: url.searchParams.get('categoria')?.slice(0, 80) || null,
		colors: url.searchParams
			.getAll('color')
			.slice(0, 20)
			.map((color) => color.slice(0, 80)),
		sizes: url.searchParams
			.getAll('talla')
			.slice(0, 20)
			.map((size) => size.slice(0, 12)),
		minPrice: Number.isFinite(min) && min > 0 ? Math.min(min, MAX_PRICE) : null,
		maxPrice: Number.isFinite(max) && max > 0 ? Math.min(max, MAX_PRICE) : null,
		sort: isProductSort(sortParam) ? sortParam : 'nuevo',
		page: Number.isFinite(page) && page > 0 ? Math.min(page, 1000) : 1,
		q: url.searchParams.get('q')?.slice(0, 120) || null
	};
}

const API_SORT: Record<ProductSort, string> = {
	nuevo: 'newest',
	'precio-asc': 'price-asc',
	'precio-desc': 'price-desc',
	nombre: 'name'
};

// ---------------------------------------------------------------------------
// Llamadas
// ---------------------------------------------------------------------------

/** Tienda, ajustes, categorías y colecciones: lo que pide el layout en cada página. */
export function getStorefront(ctx: PublicContext): Promise<ApiResult<Storefront>> {
	return publicRequest(ctx, '', storefrontSchema);
}

export function getHome(ctx: PublicContext): Promise<ApiResult<z.output<typeof homeSchema>>> {
	return publicRequest(ctx, '/home', homeSchema);
}

export function searchProducts(
	ctx: PublicContext,
	filters: ProductFilters
): Promise<ApiResult<ProductListResult>> {
	const params = new URLSearchParams();

	if (filters.category) params.set('category', filters.category);
	for (const color of filters.colors) params.append('colors', color);
	for (const size of filters.sizes) params.append('sizes', size);
	if (filters.minPrice !== null) params.set('minPrice', String(filters.minPrice));
	if (filters.maxPrice !== null) params.set('maxPrice', String(filters.maxPrice));
	if (filters.q) params.set('q', filters.q);
	params.set('sort', API_SORT[filters.sort]);
	params.set('page', String(filters.page));

	return publicRequest(ctx, `/products?${params}`, pageSchema);
}

export function getFacets(ctx: PublicContext): Promise<ApiResult<CatalogFacets>> {
	return publicRequest(ctx, '/facets', facetsSchema);
}

export function getProduct(ctx: PublicContext, slug: string): Promise<ApiResult<ProductDetail>> {
	return publicRequest(ctx, `/products/${segment(slug)}`, detailSchema);
}

export function listRelated(ctx: PublicContext, slug: string): Promise<ApiResult<ProductCard[]>> {
	return publicRequest(ctx, `/products/${segment(slug)}/related`, z.array(cardSchema));
}

/** Fichas frescas para los slugs que el navegador guardó como favoritos. */
export function lookupProducts(
	ctx: PublicContext,
	slugs: string[]
): Promise<ApiResult<ProductCard[]>> {
	return publicRequest(ctx, '/products/lookup', z.array(cardSchema), {
		method: 'POST',
		body: { slugs }
	});
}

export function getCollection(
	ctx: PublicContext,
	slug: string
): Promise<ApiResult<CollectionDetail>> {
	return publicRequest(ctx, `/collections/${segment(slug)}`, collectionDetailSchema);
}

export function getSitemap(ctx: PublicContext): Promise<ApiResult<Sitemap>> {
	return publicRequest(ctx, '/sitemap', sitemapSchema);
}

export function requestRestock(
	ctx: PublicContext,
	variantId: string,
	contact: string
): Promise<ApiResult<undefined>> {
	return publicRequest(ctx, '/restock-requests', z.undefined(), {
		method: 'POST',
		body: { variantId, contact }
	});
}
