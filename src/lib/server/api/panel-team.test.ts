import { describe, expect, it } from 'vitest';

import { checkoutSchema } from '$lib/server/api/panel-team';

const cobro = {
	url: 'https://checkout.wompi.co/p/?reference=sub-1',
	reference: 'sub-1',
	amountCop: 99000
};

const widget = {
	publicKey: 'pub_test_llave_publica',
	currency: 'COP',
	amountInCents: 9900000,
	reference: 'sub-1',
	integritySignature: 'firma-de-integridad',
	redirectUrl: 'https://globerce.co/admin/plan',
	customerEmail: null
};

describe('checkoutSchema (cobro del plan)', () => {
	it('traduce el widget a snake_case cuando viene', () => {
		const parsed = checkoutSchema.parse({ ...cobro, widget });

		expect(parsed.widget).toEqual({
			public_key: 'pub_test_llave_publica',
			currency: 'COP',
			amount_in_cents: 9900000,
			reference: 'sub-1',
			integrity_signature: 'firma-de-integridad',
			redirect_url: 'https://globerce.co/admin/plan',
			customer_email: null
		});
		expect(parsed.amount_cop).toBe(99000);
	});

	it('si la API anterior no manda widget, queda en null', () => {
		expect(checkoutSchema.parse(cobro).widget).toBeNull();
	});

	it('si la pasarela simulada manda widget null, queda en null', () => {
		expect(checkoutSchema.parse({ ...cobro, widget: null }).widget).toBeNull();
	});
});
