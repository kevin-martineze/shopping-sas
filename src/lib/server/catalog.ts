import type { SupabaseClient } from '@supabase/supabase-js';

import type {
	CatalogFacets,
	Category,
	Color,
	ProductCard,
	ProductDetail,
	ProductFilters,
	ProductImage,
	Size
} from '$lib/domain/catalog';
import { PRODUCTS_PER_PAGE, isProductSort } from '$lib/domain/catalog';

interface ProductRow {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	material: string | null;
	care: string | null;
	base_price: number;
	compare_at_price: number | null;
	created_at: string;
	categories: { name: string; slug: string } | null;
	product_images: ProductImage[];
	variants: {
		id: string;
		color_id: string;
		size_id: string;
		sku: string | null;
		stock: number;
		price_override: number | null;
		colors: Color | null;
		sizes: Size | null;
	}[];
}

const PRODUCT_SELECT = `
	id, slug, name, description, material, care, base_price, compare_at_price, created_at,
	categories ( name, slug ),
	product_images ( id, product_id, color_id, storage_path, url_full, url_card, url_thumb, lqip, alt, sort_order ),
	variants ( id, color_id, size_id, sku, stock, price_override, colors ( id, slug, name, hex, sort_order ), sizes ( id, label, sort_order ) )
`;

/** Lee los filtros desde la URL: son la fuente de verdad, no el estado local. */
export function parseFilters(url: URL): ProductFilters {
	const sortParam = url.searchParams.get('orden');
	const page = Number(url.searchParams.get('pagina') ?? '1');
	const min = Number(url.searchParams.get('min') ?? '');
	const max = Number(url.searchParams.get('max') ?? '');

	return {
		category: url.searchParams.get('categoria'),
		colors: url.searchParams.getAll('color'),
		sizes: url.searchParams.getAll('talla'),
		minPrice: Number.isFinite(min) && min > 0 ? min : null,
		maxPrice: Number.isFinite(max) && max > 0 ? max : null,
		sort: isProductSort(sortParam) ? sortParam : 'nuevo',
		page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
		q: url.searchParams.get('q')
	};
}

function toCard(row: ProductRow): ProductCard {
	const colors = new Map<string, Pick<Color, 'id' | 'slug' | 'name' | 'hex'>>();
	let inStock = false;

	for (const variant of row.variants) {
		if (variant.stock > 0) inStock = true;
		if (variant.colors) {
			colors.set(variant.colors.id, {
				id: variant.colors.id,
				slug: variant.colors.slug,
				name: variant.colors.name,
				hex: variant.colors.hex
			});
		}
	}

	const images = [...row.product_images]
		.sort((a, b) => a.sort_order - b.sort_order)
		.slice(0, 2)
		.map((image) => ({
			url_card: image.url_card,
			url_thumb: image.url_thumb,
			lqip: image.lqip,
			alt: image.alt
		}));

	return {
		id: row.id,
		slug: row.slug,
		name: row.name,
		price: row.base_price,
		compareAtPrice: row.compare_at_price,
		images,
		colors: [...colors.values()],
		inStock
	};
}

export interface ProductListResult {
	products: ProductCard[];
	total: number;
	page: number;
	pageCount: number;
}

export async function listProducts(
	supabase: SupabaseClient,
	filters: ProductFilters
): Promise<ProductListResult> {
	let query = supabase
		.from('products')
		.select(PRODUCT_SELECT, { count: 'exact' })
		.eq('status', 'active');

	if (filters.category) {
		const { data: category } = await supabase
			.from('categories')
			.select('id')
			.eq('slug', filters.category)
			.maybeSingle<{ id: string }>();

		// Categoría inexistente: lista vacía en vez de ignorar el filtro.
		query = query.eq('category_id', category?.id ?? '00000000-0000-0000-0000-000000000000');
	}

	if (filters.q) {
		query = query.ilike('name', `%${filters.q}%`);
	}

	// Color y talla se resuelven primero sobre `variants` para que una prenda
	// aparezca solo si esa combinación existe y tiene stock — y para que el
	// conteo de paginación siga siendo exacto.
	if (filters.colors.length > 0 || filters.sizes.length > 0) {
		let variantQuery = supabase
			.from('variants')
			.select('product_id, colors!inner ( slug ), sizes!inner ( label )')
			.gt('stock', 0);

		if (filters.colors.length > 0) {
			variantQuery = variantQuery.in('colors.slug', filters.colors);
		}

		if (filters.sizes.length > 0) {
			variantQuery = variantQuery.in(
				'sizes.label',
				filters.sizes.map((size) => size.toUpperCase())
			);
		}

		const { data: matches, error: variantError } =
			await variantQuery.returns<{ product_id: string }[]>();

		if (variantError) throw variantError;

		const ids = [...new Set((matches ?? []).map((row) => row.product_id))];

		if (ids.length === 0) {
			return { products: [], total: 0, page: filters.page, pageCount: 1 };
		}

		query = query.in('id', ids);
	}

	if (filters.minPrice !== null) query = query.gte('base_price', filters.minPrice);
	if (filters.maxPrice !== null) query = query.lte('base_price', filters.maxPrice);

	switch (filters.sort) {
		case 'precio-asc':
			query = query.order('base_price', { ascending: true });
			break;
		case 'precio-desc':
			query = query.order('base_price', { ascending: false });
			break;
		case 'nombre':
			query = query.order('name', { ascending: true });
			break;
		default:
			query = query.order('created_at', { ascending: false });
	}

	const from = (filters.page - 1) * PRODUCTS_PER_PAGE;
	const { data, error, count } = await query
		.range(from, from + PRODUCTS_PER_PAGE - 1)
		.returns<ProductRow[]>();

	if (error) throw error;

	const cards = (data ?? []).map(toCard);
	const total = count ?? cards.length;

	return {
		products: cards,
		total,
		page: filters.page,
		pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE))
	};
}

export async function getProductBySlug(
	supabase: SupabaseClient,
	slug: string
): Promise<ProductDetail | null> {
	const { data, error } = await supabase
		.from('products')
		.select(PRODUCT_SELECT)
		.eq('slug', slug)
		.eq('status', 'active')
		.maybeSingle<ProductRow>();

	if (error) throw error;
	if (!data) return null;

	const colors = new Map<string, Color>();
	const sizes = new Map<string, Size>();

	for (const variant of data.variants) {
		if (variant.colors) colors.set(variant.colors.id, variant.colors);
		if (variant.sizes) sizes.set(variant.sizes.id, variant.sizes);
	}

	return {
		id: data.id,
		slug: data.slug,
		name: data.name,
		description: data.description,
		material: data.material,
		care: data.care,
		basePrice: data.base_price,
		compareAtPrice: data.compare_at_price,
		categoryName: data.categories?.name ?? null,
		categorySlug: data.categories?.slug ?? null,
		images: [...data.product_images].sort((a, b) => a.sort_order - b.sort_order),
		colors: [...colors.values()].sort((a, b) => a.sort_order - b.sort_order),
		sizes: [...sizes.values()].sort((a, b) => a.sort_order - b.sort_order),
		variants: data.variants.map((variant) => ({
			id: variant.id,
			colorId: variant.color_id,
			sizeId: variant.size_id,
			sku: variant.sku,
			stock: variant.stock,
			price: variant.price_override ?? data.base_price
		}))
	};
}

export async function getFacets(supabase: SupabaseClient): Promise<CatalogFacets> {
	const [categories, colors, sizes, prices] = await Promise.all([
		supabase.from('categories').select('*').order('sort_order').returns<Category[]>(),
		supabase.from('colors').select('*').order('sort_order').returns<Color[]>(),
		supabase.from('sizes').select('*').order('sort_order').returns<Size[]>(),
		supabase
			.from('products')
			.select('base_price')
			.eq('status', 'active')
			.order('base_price', { ascending: true })
			.returns<{ base_price: number }[]>()
	]);

	const priceValues = (prices.data ?? []).map((row) => row.base_price);

	return {
		categories: categories.data ?? [],
		colors: colors.data ?? [],
		sizes: sizes.data ?? [],
		priceRange: {
			min: priceValues.at(0) ?? 0,
			max: priceValues.at(-1) ?? 0
		}
	};
}

export async function listFeatured(supabase: SupabaseClient, limit = 8): Promise<ProductCard[]> {
	const { data, error } = await supabase
		.from('products')
		.select(PRODUCT_SELECT)
		.eq('status', 'active')
		.eq('featured', true)
		.order('created_at', { ascending: false })
		.limit(limit)
		.returns<ProductRow[]>();

	if (error) throw error;
	return (data ?? []).map(toCard);
}

export async function listNewest(supabase: SupabaseClient, limit = 8): Promise<ProductCard[]> {
	const { data, error } = await supabase
		.from('products')
		.select(PRODUCT_SELECT)
		.eq('status', 'active')
		.order('created_at', { ascending: false })
		.limit(limit)
		.returns<ProductRow[]>();

	if (error) throw error;
	return (data ?? []).map(toCard);
}

export async function listBySlugs(
	supabase: SupabaseClient,
	slugs: string[]
): Promise<ProductCard[]> {
	if (slugs.length === 0) return [];

	const { data, error } = await supabase
		.from('products')
		.select(PRODUCT_SELECT)
		.eq('status', 'active')
		.in('slug', slugs)
		.returns<ProductRow[]>();

	if (error) throw error;
	return (data ?? []).map(toCard);
}

export async function listRelated(
	supabase: SupabaseClient,
	categorySlug: string | null,
	excludeSlug: string,
	limit = 4
): Promise<ProductCard[]> {
	let query = supabase
		.from('products')
		.select(PRODUCT_SELECT)
		.eq('status', 'active')
		.neq('slug', excludeSlug);

	if (categorySlug) {
		const { data: category } = await supabase
			.from('categories')
			.select('id')
			.eq('slug', categorySlug)
			.maybeSingle<{ id: string }>();

		if (category) query = query.eq('category_id', category.id);
	}

	const { data, error } = await query.limit(limit).returns<ProductRow[]>();

	if (error) throw error;
	return (data ?? []).map(toCard);
}
