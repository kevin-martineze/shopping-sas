import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WompiWidget } from '$lib/domain/wompi';

import { openWompiWidget } from '$lib/utils/wompi-widget';

const widget: WompiWidget = {
	public_key: 'pub_test_llave_publica',
	currency: 'COP',
	amount_in_cents: 4550000,
	reference: 'ord-1',
	integrity_signature: 'firma-de-integridad',
	redirect_url: 'http://localhost:5173/pedido/1',
	customer_email: 'clienta@example.com'
};

interface Llamada {
	config: Record<string, unknown>;
}

/** Un `WidgetCheckout` falso: anota la configuración y deja disparar el callback. */
function widgetFalso(resultado: { transaction?: { id: string; status: string } }) {
	const llamadas: Llamada[] = [];

	class WidgetCheckout {
		constructor(config: Record<string, unknown>) {
			llamadas.push({ config });
		}

		open(callback: (result: { transaction?: { id: string; status: string } }) => void) {
			callback(resultado);
		}
	}

	vi.stubGlobal('window', { WidgetCheckout });

	return llamadas;
}

describe('openWompiWidget', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('mapea los campos del dominio a la configuración del widget', async () => {
		const llamadas = widgetFalso({ transaction: { id: 'tx-9', status: 'APPROVED' } });

		await openWompiWidget(widget);

		expect(llamadas[0]?.config).toEqual({
			currency: 'COP',
			amountInCents: 4550000,
			reference: 'ord-1',
			publicKey: 'pub_test_llave_publica',
			signature: { integrity: 'firma-de-integridad' },
			redirectUrl: 'http://localhost:5173/pedido/1',
			customerData: { email: 'clienta@example.com' }
		});
	});

	it('sin email no manda customerData', async () => {
		const llamadas = widgetFalso({ transaction: { id: 'tx-9', status: 'APPROVED' } });

		await openWompiWidget({ ...widget, customer_email: null });

		expect(llamadas[0]?.config).not.toHaveProperty('customerData');
	});

	it('resuelve con la transacción del callback', async () => {
		widgetFalso({ transaction: { id: 'tx-9', status: 'DECLINED' } });

		await expect(openWompiWidget(widget)).resolves.toEqual({ id: 'tx-9', status: 'DECLINED' });
	});

	it('resuelve con null si el callback no trae transacción', async () => {
		widgetFalso({});

		await expect(openWompiWidget(widget)).resolves.toBeNull();
	});
});
