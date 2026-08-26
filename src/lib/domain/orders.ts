export const ORDER_STATUSES = [
	'pending',
	'confirmed',
	'shipped',
	'delivered',
	'cancelled'
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string | null): value is OrderStatus {
	return value !== null && ORDER_STATUSES.some((status) => status === value);
}

/** Etiquetas en español para el panel; el valor guardado siempre es el inglés. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
	pending: 'Pendiente',
	confirmed: 'Confirmado',
	shipped: 'Enviado',
	delivered: 'Entregado',
	cancelled: 'Cancelado'
};

export interface OrderItem {
	id: string;
	variant_id: string | null;
	product_id: string | null;
	product_name: string;
	product_slug: string;
	color_name: string;
	size_label: string;
	sku: string | null;
	unit_price: number;
	qty: number;
	line_total: number;
}

export interface Order {
	id: string;
	number: number;
	public_token: string;
	status: OrderStatus;
	customer_name: string;
	customer_phone: string;
	customer_city: string | null;
	customer_address: string | null;
	customer_notes: string | null;
	shipping_zone_id: string | null;
	shipping_zone_name: string | null;
	shipping_cost: number;
	coupon_code: string | null;
	subtotal: number;
	discount: number;
	total: number;
	whatsapp_opened_at: string | null;
	admin_notes: string | null;
	created_at: string;
}

export interface OrderWithItems extends Order {
	items: OrderItem[];
}

/** Línea del carrito ya revalidada contra la base de datos. */
export interface PricedLine {
	variantId: string;
	productId: string;
	productName: string;
	productSlug: string;
	colorName: string;
	sizeLabel: string;
	unitPrice: number;
	qty: number;
	lineTotal: number;
	stock: number;
	imageUrl: string | null;
	/** Cantidad que hubo que recortar por falta de stock, si la hubo. */
	adjustedFrom: number | null;
}

export interface CartTotals {
	subtotal: number;
	discount: number;
	shippingCost: number;
	total: number;
}

export interface CreateOrderResult {
	ok: boolean;
	id?: string;
	number?: number;
	token?: string;
	error?: string;
	reason?: string;
	items?: {
		variant_id: string;
		requested: number;
		available: number;
		product: string;
		color: string;
		size: string;
	}[];
}
