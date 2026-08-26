/** Tipos del catálogo. Los precios son enteros en pesos colombianos. */

export type ProductStatus = 'draft' | 'active' | 'archived';

export interface Category {
	id: string;
	slug: string;
	name: string;
	parent_id: string | null;
	sort_order: number;
	active: boolean;
}

export interface Color {
	id: string;
	slug: string;
	name: string;
	hex: string;
	sort_order: number;
}

export interface Size {
	id: string;
	label: string;
	sort_order: number;
}

export interface ProductImage {
	id: string;
	product_id: string;
	color_id: string | null;
	storage_path: string;
	url_full: string;
	url_card: string;
	url_thumb: string;
	lqip: string | null;
	alt: string | null;
	sort_order: number;
}

export interface Variant {
	id: string;
	product_id: string;
	color_id: string;
	size_id: string;
	sku: string | null;
	stock: number;
	price_override: number | null;
	active: boolean;
}

export interface Product {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	material: string | null;
	care: string | null;
	category_id: string | null;
	base_price: number;
	compare_at_price: number | null;
	status: ProductStatus;
	featured: boolean;
	created_at: string;
	updated_at: string;
}

/** Producto tal como se pinta en una grilla: mínimo necesario para la tarjeta. */
export interface ProductCard {
	id: string;
	slug: string;
	name: string;
	price: number;
	compareAtPrice: number | null;
	images: Pick<ProductImage, 'url_card' | 'url_thumb' | 'lqip' | 'alt'>[];
	colors: Pick<Color, 'id' | 'slug' | 'name' | 'hex'>[];
	inStock: boolean;
}

/** Variante enriquecida con color y talla, lista para el selector. */
export interface VariantOption {
	id: string;
	colorId: string;
	sizeId: string;
	sku: string | null;
	stock: number;
	price: number;
}

export interface ProductDetail {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	material: string | null;
	care: string | null;
	basePrice: number;
	compareAtPrice: number | null;
	categoryName: string | null;
	categorySlug: string | null;
	images: ProductImage[];
	colors: Color[];
	sizes: Size[];
	variants: VariantOption[];
}

export interface CatalogFacets {
	categories: Category[];
	colors: Color[];
	sizes: Size[];
	priceRange: { min: number; max: number };
}

export const PRODUCT_SORTS = ['nuevo', 'precio-asc', 'precio-desc', 'nombre'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export function isProductSort(value: string | null): value is ProductSort {
	return value !== null && PRODUCT_SORTS.some((sort) => sort === value);
}

export interface ProductFilters {
	category: string | null;
	colors: string[];
	sizes: string[];
	minPrice: number | null;
	maxPrice: number | null;
	sort: ProductSort;
	page: number;
	q: string | null;
}

export const PRODUCTS_PER_PAGE = 12;
