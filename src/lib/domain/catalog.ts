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

/** Una categoría con sus hijas, ya ordenadas. Para el menú por categorías. */
export interface CategoryNode {
	category: Category;
	children: CategoryNode[];
}

/**
 * El árbol de categorías para el menú. Las raíces y las hijas van por
 * `sort_order` y, a igualdad, por nombre.
 *
 * Una categoría cuyo padre no está en la lista sube a la raíz: mejor aparecer
 * en el primer nivel que desaparecer. Un ciclo (A es padre de B y B de A) no
 * tiene raíz; sus miembros también suben, una sola vez cada uno.
 */
export function buildCategoryTree(categories: Category[]): CategoryNode[] {
	const byId = new Map(categories.map((category) => [category.id, category]));
	const childrenOf = new Map<string, Category[]>();
	const roots: Category[] = [];

	for (const category of categories) {
		const parent = category.parent_id ? byId.get(category.parent_id) : undefined;

		if (parent && parent.id !== category.id) {
			childrenOf.set(parent.id, [...(childrenOf.get(parent.id) ?? []), category]);
		} else {
			roots.push(category);
		}
	}

	const visited = new Set<string>();

	function build(category: Category): CategoryNode {
		visited.add(category.id);

		const children = sortCategories(childrenOf.get(category.id) ?? [])
			.filter((child) => !visited.has(child.id))
			.map(build);

		return { category, children };
	}

	const nodes = sortCategories(roots).map(build);

	// Los que no llegaron desde ninguna raíz están en un ciclo: suben a raíz.
	// Se revisa `visited` en cada vuelta: construir uno puede construir a sus compañeros.
	const extra: CategoryNode[] = [];

	for (const category of sortCategories(categories)) {
		if (!visited.has(category.id)) extra.push(build(category));
	}

	return [...nodes, ...extra];
}

function sortCategories(categories: Category[]): Category[] {
	return [...categories].sort(
		(a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'es')
	);
}
