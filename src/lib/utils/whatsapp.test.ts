import type { OrderWithItems } from '$lib/domain/orders';

import { describe, expect, it } from 'vitest';

import { buildOrderMessage, buildWhatsAppUrl, normalizePhone } from '$lib/utils/whatsapp';

function makeOrder(overrides: Partial<OrderWithItems> = {}): OrderWithItems {
	return {
		id: 'order-1',
		number: 1042,
		public_token: 'token-1',
		status: 'pending',
		customer_name: 'Ana Ruiz',
		customer_phone: '3001234567',
		customer_city: 'Bogotá',
		customer_address: 'Calle 1 # 2-3',
		customer_notes: null,
		shipping_zone_id: 'zone-1',
		shipping_zone_name: 'Bogotá',
		shipping_cost: 8000,
		coupon_code: null,
		subtotal: 189000,
		discount: 0,
		total: 197000,
		whatsapp_opened_at: null,
		admin_notes: null,
		created_at: '2026-08-01T10:00:00Z',
		items: [
			{
				id: 'item-1',
				variant_id: 'variant-1',
				product_id: 'product-1',
				product_name: 'Blusa Vera',
				product_slug: 'blusa-vera',
				color_name: 'Crudo',
				size_label: 'M',
				sku: 'BLUSAVERA-CRUDO-M',
				unit_price: 189000,
				qty: 1,
				line_total: 189000
			}
		],
		...overrides
	};
}

const options = { storeName: 'Atelier', orderUrl: 'https://tienda.test/pedido/1042?t=token-1' };

describe('buildOrderMessage', () => {
	it('incluye número, líneas, totales y datos de contacto', () => {
		const message = buildOrderMessage(makeOrder(), options);

		expect(message).toContain('Pedido #1042');
		expect(message).toContain('1x Blusa Vera — Crudo / M — $189.000');
		expect(message).toContain('Subtotal: $189.000');
		expect(message).toContain('Envío (Bogotá): $8.000');
		expect(message).toContain('Total: $197.000');
		expect(message).toContain('Nombre: Ana Ruiz');
		expect(message).toContain(options.orderUrl);
	});

	it('muestra el descuento con su código', () => {
		const message = buildOrderMessage(
			makeOrder({ discount: 18900, coupon_code: 'BIENVENIDA10', total: 178100 }),
			options
		);

		expect(message).toContain('Descuento (BIENVENIDA10): -$18.900');
	});

	it('escribe "Gratis" cuando el envío no cuesta', () => {
		const message = buildOrderMessage(makeOrder({ shipping_cost: 0, total: 189000 }), options);

		expect(message).toContain('Envío (Bogotá): Gratis');
	});

	it('omite líneas de dirección vacías', () => {
		const message = buildOrderMessage(
			makeOrder({ customer_city: null, customer_address: null }),
			options
		);

		expect(message).not.toContain('Ciudad:');
		expect(message).not.toContain('Dirección:');
	});

	it('resume el pedido cuando el mensaje se pasa de largo', () => {
		const items = Array.from({ length: 60 }, (_, index) => ({
			id: `item-${index}`,
			variant_id: `variant-${index}`,
			product_id: `product-${index}`,
			product_name: `Prenda de nombre largo número ${index}`,
			product_slug: `prenda-${index}`,
			color_name: 'Terracota',
			size_label: 'M',
			sku: `SKU-${index}`,
			unit_price: 189000,
			qty: 2,
			line_total: 378000
		}));

		const message = buildOrderMessage(makeOrder({ items }), options);

		expect(message.length).toBeLessThanOrEqual(1800);
		expect(message).toContain('120 prendas (60 referencias)');
		expect(message).toContain(options.orderUrl);
	});
});

describe('normalizePhone', () => {
	it('deja solo dígitos', () => {
		expect(normalizePhone('+57 (300) 123-4567')).toBe('573001234567');
	});
});

describe('buildWhatsAppUrl', () => {
	it('arma el enlace de wa.me con el texto codificado', () => {
		const url = buildWhatsAppUrl('+57 300 1234567', 'Hola Atelier');

		expect(url).toBe('https://wa.me/573001234567?text=Hola%20Atelier');
	});
});
