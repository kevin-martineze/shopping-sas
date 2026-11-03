import { describe, expect, it } from 'vitest';

import { paymentLinkSchema } from '$lib/server/api/checkout';

const enlace = {
	url: 'https://checkout.wompi.co/p/?reference=ord-1',
	reference: 'ord-1',
	amountCop: 45500
};

const widget = {
	publicKey: 'pub_test_llave_publica',
	currency: 'COP',
	amountInCents: 4550000,
	reference: 'ord-1',
	integritySignature: 'firma-de-integridad',
	redirectUrl: 'http://localhost:5173/pedido/1',
	customerEmail: 'clienta@example.com'
};

describe('paymentLinkSchema', () => {
	it('traduce el widget a snake_case cuando viene', () => {
		const parsed = paymentLinkSchema.parse({ ...enlace, widget });

		expect(parsed.widget).toEqual({
			public_key: 'pub_test_llave_publica',
			currency: 'COP',
			amount_in_cents: 4550000,
			reference: 'ord-1',
			integrity_signature: 'firma-de-integridad',
			redirect_url: 'http://localhost:5173/pedido/1',
			customer_email: 'clienta@example.com'
		});
	});

	it('sin email, customer_email es null', () => {
		const parsed = paymentLinkSchema.parse({
			...enlace,
			widget: { ...widget, customerEmail: null }
		});

		expect(parsed.widget?.customer_email).toBeNull();
	});

	it('si la API anterior no manda widget, queda en null', () => {
		const parsed = paymentLinkSchema.parse(enlace);

		expect(parsed.widget).toBeNull();
		expect(parsed.url).toBe(enlace.url);
		expect(parsed.amount_cop).toBe(45500);
	});

	it('si la pasarela simulada manda widget null, queda en null', () => {
		const parsed = paymentLinkSchema.parse({ ...enlace, widget: null });

		expect(parsed.widget).toBeNull();
	});
});
