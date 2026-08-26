export interface StoreSettings {
	store_name: string;
	whatsapp_phone: string;
	instagram_url: string | null;
	announcement: string | null;
	free_shipping_threshold: number | null;
	/** Si hay colección elegida manda ella; si no, mandan estos textos. */
	hero_collection_id: string | null;
	hero_title: string | null;
	hero_subtitle: string | null;
}

/** Bloques cortos que van bajo el hero de la portada. */
export interface HomeHighlight {
	id: string;
	eyebrow: string;
	title: string;
	body: string;
	sort_order: number;
	active: boolean;
}

export interface ShippingZone {
	id: string;
	name: string;
	cost: number;
	eta_days: number | null;
	active: boolean;
	sort_order: number;
}

export type CouponType = 'percent' | 'fixed';

export interface Coupon {
	id: string;
	code: string;
	type: CouponType;
	value: number;
	min_subtotal: number;
	starts_at: string | null;
	ends_at: string | null;
	max_uses: number | null;
	uses: number;
	active: boolean;
	created_at: string;
}

export interface AppliedCoupon {
	code: string;
	type: CouponType;
	value: number;
	discount: number;
}

/** Motivos que devuelve `validate_coupon` cuando el cupón no aplica. */
export const COUPON_REJECTION_LABEL: Record<string, string> = {
	not_found: 'Ese código no existe.',
	inactive: 'Ese cupón ya no está activo.',
	not_started: 'Ese cupón todavía no empieza.',
	expired: 'Ese cupón ya venció.',
	exhausted: 'Ese cupón alcanzó su límite de usos.',
	min_subtotal: 'Tu pedido no alcanza el mínimo del cupón.',
	invalid_subtotal: 'No pudimos calcular el subtotal del pedido.'
};

export interface Collection {
	id: string;
	slug: string;
	name: string;
	description: string | null;
	hero_image_url: string | null;
	hero_storage_path: string | null;
	active: boolean;
	sort_order: number;
}
