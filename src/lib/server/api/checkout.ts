import type { CartTotals, OrderItem, PricedLine, PublicOrderView } from '$lib/domain/orders';
import type { AppliedCoupon, ShippingZone } from '$lib/domain/settings';
import type { ApiResult } from '$lib/server/api/client';
import type { PricedCart, RawCartLine } from '$lib/server/cart';
import type { PublicContext } from '$lib/server/context';

import { z } from 'zod';

import { publicRequest } from '$lib/server/api/request';
import { orderPaymentStatusSchema, orderStatusSchema } from '$lib/server/api/statuses';

/**
 * Carrito y pedido de la tienda pública.
 *
 * Las reglas de precio viven solo en la API: el carrito ya no las replica. Lo
 * que se cotiza es exactamente lo que después cobra el pedido.
 */

const zoneSchema = z
	.object({ id: z.string(), name: z.string(), cost: z.number(), etaDays: z.number().nullable() })
	.transform((zone): ShippingZone => ({
		id: zone.id,
		name: zone.name,
		cost: zone.cost,
		eta_days: zone.etaDays,
		// La API pública solo devuelve zonas activas, ya en su orden.
		active: true,
		sort_order: 0
	}));

const quotedLineSchema = z.object({
	variantId: z.string(),
	productId: z.string(),
	productName: z.string(),
	productSlug: z.string(),
	variantLabel: z.string(),
	unitPrice: z.number(),
	qty: z.number(),
	lineTotal: z.number(),
	stock: z.number(),
	imageUrl: z.string().nullable(),
	adjustedFrom: z.number().nullable()
});

const quoteSchema = z
	.object({
		lines: z.array(quotedLineSchema),
		removed: z.array(z.object({ variantId: z.string(), label: z.string() })),
		coupon: z
			.object({
				code: z.string(),
				type: z.enum(['PERCENT', 'FIXED']),
				value: z.number(),
				discount: z.number()
			})
			.nullable(),
		couponRejection: z.string().nullable(),
		zone: z.object({ id: z.string() }).nullable(),
		totals: z.object({
			subtotal: z.number(),
			discount: z.number(),
			shippingCost: z.number(),
			total: z.number()
		})
	})
	.transform((quote) => {
		const lines: PricedLine[] = quote.lines;
		const priced: PricedCart = { lines, removed: quote.removed, subtotal: quote.totals.subtotal };
		const totals: CartTotals = quote.totals;
		const coupon: AppliedCoupon | null = quote.coupon
			? {
					code: quote.coupon.code,
					type: quote.coupon.type === 'PERCENT' ? 'percent' : 'fixed',
					value: quote.coupon.value,
					discount: quote.coupon.discount
				}
			: null;

		return {
			priced,
			totals,
			coupon,
			couponRejection: quote.couponRejection,
			zoneId: quote.zone?.id ?? null
		};
	});

const createdSchema = z.object({ id: z.string(), number: z.number(), token: z.string() });

/** El detalle de un 409 `out_of_stock`. */
export const stockProblemsSchema = z.array(
	z.object({
		variantId: z.string(),
		requested: z.number(),
		available: z.number(),
		product: z.string(),
		color: z.string(),
		size: z.string()
	})
);

const publicOrderSchema = z
	.object({
		number: z.number(),
		token: z.string(),
		status: orderStatusSchema,
		customerName: z.string(),
		customerPhone: z.string(),
		customerCity: z.string().nullable(),
		customerAddress: z.string().nullable(),
		customerNotes: z.string().nullable(),
		shippingZoneName: z.string().nullable(),
		shippingCost: z.number(),
		couponCode: z.string().nullable(),
		subtotal: z.number(),
		discount: z.number(),
		total: z.number(),
		whatsappOpenedAt: z.string().nullable(),
		paymentStatus: orderPaymentStatusSchema,
		paidAt: z.string().nullable(),
		createdAt: z.string(),
		items: z.array(
			z
				.object({
					id: z.string(),
					productName: z.string(),
					productSlug: z.string(),
					variantLabel: z.string(),
					sku: z.string().nullable(),
					unitPrice: z.number(),
					qty: z.number(),
					lineTotal: z.number()
				})
				.transform((item): OrderItem => ({
					id: item.id,
					// La vista pública no expone de qué variante salió cada línea.
					variant_id: null,
					product_id: null,
					product_name: item.productName,
					product_slug: item.productSlug,
					variant_label: item.variantLabel,
					sku: item.sku,
					unit_price: item.unitPrice,
					qty: item.qty,
					line_total: item.lineTotal
				}))
		)
	})
	.transform((order): PublicOrderView => ({
		number: order.number,
		public_token: order.token,
		status: order.status,
		customer_name: order.customerName,
		customer_phone: order.customerPhone,
		customer_city: order.customerCity,
		customer_address: order.customerAddress,
		customer_notes: order.customerNotes,
		shipping_zone_name: order.shippingZoneName,
		shipping_cost: order.shippingCost,
		coupon_code: order.couponCode,
		subtotal: order.subtotal,
		discount: order.discount,
		total: order.total,
		whatsapp_opened_at: order.whatsappOpenedAt,
		payment_status: order.paymentStatus,
		paid_at: order.paidAt,
		created_at: order.createdAt,
		items: order.items
	}));

export type CartQuote = z.output<typeof quoteSchema>;

export interface CreateOrderInput {
	customer: {
		name: string;
		phone: string;
		city: string;
		address: string;
		notes: string;
	};
	shippingZoneId: string;
	couponCode: string | null;
	items: RawCartLine[];
}

export function listShippingZones(ctx: PublicContext): Promise<ApiResult<ShippingZone[]>> {
	return publicRequest(ctx, '/shipping-zones', z.array(zoneSchema));
}

/** Precios y stock de hoy, cupón y envío: la vista previa antes de confirmar. */
export function quoteCart(
	ctx: PublicContext,
	lines: RawCartLine[],
	couponCode: string,
	shippingZoneId: string | null
): Promise<ApiResult<CartQuote>> {
	return publicRequest(ctx, '/cart/quote', quoteSchema, {
		method: 'POST',
		body: {
			items: lines,
			couponCode: couponCode.slice(0, 40) || undefined,
			shippingZoneId: shippingZoneId ?? undefined
		}
	});
}

export function createOrder(
	ctx: PublicContext,
	input: CreateOrderInput,
	idempotencyKey: string
): Promise<ApiResult<z.output<typeof createdSchema>>> {
	return publicRequest(ctx, '/orders', createdSchema, {
		method: 'POST',
		body: {
			customer: input.customer,
			shippingZoneId: input.shippingZoneId,
			couponCode: input.couponCode ?? undefined,
			items: input.items
		},
		idempotencyKey
	});
}

export function getPublicOrder(
	ctx: PublicContext,
	orderNumber: number,
	token: string
): Promise<ApiResult<PublicOrderView>> {
	const params = new URLSearchParams({ token });

	return publicRequest(ctx, `/orders/${orderNumber}?${params}`, publicOrderSchema);
}

export function markWhatsappOpened(
	ctx: PublicContext,
	orderNumber: number,
	token: string
): Promise<ApiResult<undefined>> {
	return publicRequest(ctx, `/orders/${orderNumber}/whatsapp-opened`, z.undefined(), {
		method: 'POST',
		body: { token }
	});
}

export interface PaymentLink {
	url: string;
	reference: string;
	amount_cop: number;
}

const paymentLinkSchema = z
	.object({ url: z.string().url(), reference: z.string(), amountCop: z.number() })
	.transform((link): PaymentLink => ({
		url: link.url,
		reference: link.reference,
		amount_cop: link.amountCop
	}));

/**
 * Pide a dónde ir a pagar un pedido.
 *
 * El monto lo pone la API a partir del pedido guardado, no este llamado: un
 * total que viajara desde el navegador sería un total que se puede cambiar.
 */
export function startOrderPayment(
	ctx: PublicContext,
	number: number,
	token: string,
	redirectUrl: string
): Promise<ApiResult<PaymentLink>> {
	return publicRequest(ctx, `/orders/${number}/checkout`, paymentLinkSchema, {
		method: 'POST',
		body: { token, redirectUrl }
	});
}
