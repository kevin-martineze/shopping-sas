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
	/** "Rojo · M". Vacío si el producto no tiene ejes. */
	variant_label: string;
	sku: string | null;
	unit_price: number;
	qty: number;
	line_total: number;
}

/**
 * El cobro de un pedido, aparte de su estado.
 *
 * Una venta contra entrega va confirmada y sin pagar, y una pagada puede
 * terminar cancelada: son dos cosas distintas y por eso no se mezclan.
 */
export type OrderPaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed';

export const ORDER_PAYMENT_LABEL: Record<OrderPaymentStatus, string> = {
	unpaid: 'Sin pagar',
	pending: 'Pago en curso',
	paid: 'Pagado',
	failed: 'Pago fallido'
};

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
	/** Cómo va el cobro, que no es cómo va el pedido. */
	payment_status: OrderPaymentStatus;
	paid_at: string | null;
	created_at: string;
}

export interface OrderWithItems extends Order {
	items: OrderItem[];
}

/** El pedido como lo ve el cliente en su enlace: sin los datos internos del panel. */
export type PublicOrderView = Omit<OrderWithItems, 'id' | 'shipping_zone_id' | 'admin_notes'>;

/** Línea del carrito ya revalidada contra la base de datos. */
export interface PricedLine {
	variantId: string;
	productId: string;
	productName: string;
	productSlug: string;
	/** "Rojo · M". Vacío si el producto no tiene ejes. */
	variantLabel: string;
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
