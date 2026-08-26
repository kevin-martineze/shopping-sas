import type { SupabaseClient } from '@supabase/supabase-js';

import type { Collection, HomeHighlight, ShippingZone, StoreSettings } from '$lib/domain/settings';
import type { Category, ProductCard } from '$lib/domain/catalog';

const FALLBACK_SETTINGS: StoreSettings = {
	store_name: 'Tienda',
	whatsapp_phone: '573000000000',
	instagram_url: null,
	announcement: null,
	free_shipping_threshold: null,
	hero_collection_id: null,
	hero_title: null,
	hero_subtitle: null
};

export async function getSettings(supabase: SupabaseClient): Promise<StoreSettings> {
	const { data, error } = await supabase
		.from('settings')
		.select(
			'store_name, whatsapp_phone, instagram_url, announcement, free_shipping_threshold, hero_collection_id, hero_title, hero_subtitle'
		)
		.maybeSingle<StoreSettings>();

	if (error) throw error;
	return data ?? FALLBACK_SETTINGS;
}

/** Bloques de la portada, en el orden en que se muestran. */
export async function listHomeHighlights(
	supabase: SupabaseClient,
	includeHidden = false
): Promise<HomeHighlight[]> {
	let query = supabase.from('home_highlights').select('*').order('sort_order');
	if (!includeHidden) query = query.eq('active', true);

	const { data, error } = await query.returns<HomeHighlight[]>();

	if (error) throw error;
	return data ?? [];
}

export async function listShippingZones(
	supabase: SupabaseClient,
	includeInactive = false
): Promise<ShippingZone[]> {
	let query = supabase.from('shipping_zones').select('*').order('sort_order');
	if (!includeInactive) query = query.eq('active', true);

	const { data, error } = await query.returns<ShippingZone[]>();

	if (error) throw error;
	return data ?? [];
}

export async function getShippingZone(
	supabase: SupabaseClient,
	id: string | null
): Promise<ShippingZone | null> {
	if (!id) return null;

	const { data, error } = await supabase
		.from('shipping_zones')
		.select('*')
		.eq('id', id)
		.eq('active', true)
		.maybeSingle<ShippingZone>();

	if (error) throw error;
	return data;
}

export async function listCategories(supabase: SupabaseClient): Promise<Category[]> {
	const { data, error } = await supabase
		.from('categories')
		.select('*')
		.order('sort_order')
		.returns<Category[]>();

	if (error) throw error;
	return data ?? [];
}

export async function listCollections(supabase: SupabaseClient): Promise<Collection[]> {
	const { data, error } = await supabase
		.from('collections')
		.select('*')
		.order('sort_order')
		.returns<Collection[]>();

	if (error) throw error;
	return data ?? [];
}

interface CollectionRow extends Collection {
	collection_products: {
		sort_order: number;
		hotspot_x: number | null;
		hotspot_y: number | null;
		products: {
			id: string;
			slug: string;
			name: string;
			base_price: number;
			compare_at_price: number | null;
			status: string;
			product_images: {
				url_card: string;
				url_thumb: string;
				lqip: string | null;
				alt: string | null;
				sort_order: number;
			}[];
			variants: {
				stock: number;
				colors: { id: string; slug: string; name: string; hex: string } | null;
			}[];
		} | null;
	}[];
}

export interface CollectionDetail extends Collection {
	items: {
		hotspotX: number | null;
		hotspotY: number | null;
		product: ProductCard;
	}[];
}

export async function getCollectionBySlug(
	supabase: SupabaseClient,
	slug: string
): Promise<CollectionDetail | null> {
	const { data, error } = await supabase
		.from('collections')
		.select(
			`*, collection_products (
				sort_order, hotspot_x, hotspot_y,
				products (
					id, slug, name, base_price, compare_at_price, status,
					product_images ( url_card, url_thumb, lqip, alt, sort_order ),
					variants ( stock, colors ( id, slug, name, hex ) )
				)
			)`
		)
		.eq('slug', slug)
		.eq('active', true)
		.maybeSingle<CollectionRow>();

	if (error) throw error;
	if (!data) return null;

	const items = [...data.collection_products]
		.sort((a, b) => a.sort_order - b.sort_order)
		.flatMap((entry) => {
			const product = entry.products;
			if (!product || product.status !== 'active') return [];

			const colors = new Map<string, { id: string; slug: string; name: string; hex: string }>();
			let inStock = false;

			for (const variant of product.variants) {
				if (variant.stock > 0) inStock = true;
				if (variant.colors) colors.set(variant.colors.id, variant.colors);
			}

			const card: ProductCard = {
				id: product.id,
				slug: product.slug,
				name: product.name,
				price: product.base_price,
				compareAtPrice: product.compare_at_price,
				images: [...product.product_images]
					.sort((a, b) => a.sort_order - b.sort_order)
					.slice(0, 2)
					.map((image) => ({
						url_card: image.url_card,
						url_thumb: image.url_thumb,
						lqip: image.lqip,
						alt: image.alt
					})),
				colors: [...colors.values()],
				inStock
			};

			return [{ hotspotX: entry.hotspot_x, hotspotY: entry.hotspot_y, product: card }];
		});

	const { collection_products, ...collection } = data;
	void collection_products;

	return { ...collection, items };
}
