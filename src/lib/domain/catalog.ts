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

/**
 * Un eje por el que se divide un producto: Variación, Color, Molienda, Formato.
 *
 * Es del PRODUCTO y no de la tienda. Antes había dos listas fijas —colores y
 * variaciones— y eso obligaba a toda tienda a vender ropa.
 */
export interface ProductOption {
	id: string;
	name: string;
	sortOrder: number;
	values: ProductOptionValue[];
}

export interface ProductOptionValue {
	id: string;
	value: string;
	/** Solo cuando el valor es un color. La vitrina pinta la muestra con esto. */
	hex: string | null;
	sortOrder: number;
}

/** Un dato suelto del producto: Material, ISBN, Origen… */
export interface ProductAttribute {
	name: string;
	value: string;
}

export interface ProductImage {
	id: string;
	product_id: string;
	option_value_id: string | null;
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
	/** Tonos con alguna variante activa. Vacío si el producto no tiene ninguno. */
	swatches: { value: string; hex: string }[];
	inStock: boolean;
}

/** Variante con los valores que la forman, lista para el selector. */
export interface VariantOption {
	id: string;
	/** Un valor por cada eje. Vacío si el producto no tiene ejes. */
	valueIds: string[];
	sku: string | null;
	stock: number;
	price: number;
}

/** Foto tal como la ve la tienda pública: sin la ruta del archivo, que es dato del panel. */
export type PublicProductImage = Omit<ProductImage, 'product_id' | 'storage_path'>;

export interface ProductDetail {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	basePrice: number;
	compareAtPrice: number | null;
	categoryName: string | null;
	categorySlug: string | null;
	images: PublicProductImage[];
	options: ProductOption[];
	attributes: ProductAttribute[];
	variants: VariantOption[];
}

export interface FacetOption {
	name: string;
	sortOrder: number;
	values: { value: string; hex: string | null; sortOrder: number }[];
}

export interface CatalogFacets {
	categories: Category[];
	/** Los ejes que de verdad usan los productos publicados. */
	options: FacetOption[];
	priceRange: { min: number; max: number };
}

export const PRODUCT_SORTS = ['nuevo', 'precio-asc', 'precio-desc', 'nombre'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export function isProductSort(value: string | null): value is ProductSort {
	return value !== null && PRODUCT_SORTS.some((sort) => sort === value);
}

export interface ProductFilters {
	category: string | null;
	/**
	 * Filtros por eje, como `Color:Rojo`.
	 *
	 * Un solo arreglo y no un campo por eje: los ejes los declara cada
	 * producto, así que la tienda no sabe de antemano cuáles hay.
	 */
	options: string[];
	minPrice: number | null;
	maxPrice: number | null;
	sort: ProductSort;
	page: number;
	q: string | null;
}

export const PRODUCTS_PER_PAGE = 12;
