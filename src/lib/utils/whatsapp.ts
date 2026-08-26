import type { OrderWithItems } from '$lib/domain/orders';

import { formatMoney } from '$lib/utils/money';

/** Margen de seguridad: wa.me tolera más, pero los enlaces largos se rompen al compartirse. */
const MAX_MESSAGE_LENGTH = 1800;

export interface OrderMessageOptions {
	storeName: string;
	orderUrl: string;
}

/** Deja solo dígitos: wa.me no acepta "+", espacios ni guiones. */
export function normalizePhone(phone: string): string {
	return phone.replace(/\D/g, '');
}

function line(item: OrderWithItems['items'][number]): string {
	return `• ${item.qty}x ${item.product_name} — ${item.color_name} / ${item.size_label} — ${formatMoney(item.line_total)}`;
}

export function buildOrderMessage(order: OrderWithItems, options: OrderMessageOptions): string {
	const header = [
		`Hola ${options.storeName}, quiero confirmar este pedido.`,
		'',
		`Pedido #${order.number}`,
		''
	];

	const totals = [
		'',
		`Subtotal: ${formatMoney(order.subtotal)}`,
		...(order.discount > 0
			? [
					`Descuento${order.coupon_code ? ` (${order.coupon_code})` : ''}: -${formatMoney(order.discount)}`
				]
			: []),
		`Envío${order.shipping_zone_name ? ` (${order.shipping_zone_name})` : ''}: ${
			order.shipping_cost > 0 ? formatMoney(order.shipping_cost) : 'Gratis'
		}`,
		`Total: ${formatMoney(order.total)}`,
		'',
		`Nombre: ${order.customer_name}`,
		`Teléfono: ${order.customer_phone}`,
		...(order.customer_city ? [`Ciudad: ${order.customer_city}`] : []),
		...(order.customer_address ? [`Dirección: ${order.customer_address}`] : []),
		...(order.customer_notes ? [`Notas: ${order.customer_notes}`] : []),
		'',
		`Detalle: ${options.orderUrl}`
	];

	const full = [...header, ...order.items.map(line), ...totals].join('\n');
	if (full.length <= MAX_MESSAGE_LENGTH) return full;

	// Pedido largo: se resume y el detalle completo queda en el enlace.
	const totalUnits = order.items.reduce((sum, item) => sum + item.qty, 0);
	const summary = [`• ${totalUnits} prendas (${order.items.length} referencias)`];

	return [...header, ...summary, ...totals].join('\n');
}

export function buildWhatsAppUrl(phone: string, message: string): string {
	return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

/** Mensaje corto para consultar por una prenda concreta desde su ficha. */
export function buildProductInquiryUrl(
	phone: string,
	storeName: string,
	productName: string,
	productUrl: string
): string {
	const message = `Hola ${storeName}, tengo una pregunta sobre "${productName}".\n${productUrl}`;
	return buildWhatsAppUrl(phone, message);
}

/** Aviso que la administradora envía cuando vuelve a haber stock. */
export function buildRestockUrl(
	phone: string,
	storeName: string,
	productName: string,
	sizeLabel: string,
	productUrl: string
): string {
	const message = `Hola, te escribimos de ${storeName}. Ya volvió a haber "${productName}" en talla ${sizeLabel}.\n${productUrl}`;
	return buildWhatsAppUrl(phone, message);
}
