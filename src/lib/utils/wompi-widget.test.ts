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

type ResultadoWidget = { transaction?: { id: string; status: string } };

/**
 * Un `WidgetCheckout` falso: anota la configuración y guarda el callback para
 * dispararlo cuando la prueba quiera, como hace Wompi al cerrar el pago.
 */
function widgetFalso() {
	const configs: Record<string, unknown>[] = [];
	let callback: ((resultado: ResultadoWidget) => void) | null = null;

	class WidgetCheckout {
		constructor(config: Record<string, unknown>) {
			configs.push(config);
		}

		open(cb: (resultado: ResultadoWidget) => void) {
			callback = cb;
		}
	}

	vi.stubGlobal('window', { WidgetCheckout });

	return {
		configs,
		cerrarCon(resultado: ResultadoWidget) {
			callback?.(resultado);
		}
	};
}

describe('openWompiWidget', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('mapea los campos del dominio a la configuración del widget', async () => {
		const falso = widgetFalso();

		await openWompiWidget(widget, () => {});

		expect(falso.configs[0]).toEqual({
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
		const falso = widgetFalso();

		await openWompiWidget({ ...widget, customer_email: null }, () => {});

		expect(falso.configs[0]).not.toHaveProperty('customerData');
	});

	it('resuelve al abrir el widget, sin esperar el pago', async () => {
		const falso = widgetFalso();
		const onResult = vi.fn();

		await openWompiWidget(widget, onResult);

		// El widget ya está abierto, pero la clienta todavía no pagó.
		expect(onResult).not.toHaveBeenCalled();

		falso.cerrarCon({ transaction: { id: 'tx-9', status: 'APPROVED' } });

		expect(onResult).toHaveBeenCalledTimes(1);
	});

	it('pasa la transacción del callback a onResult', async () => {
		const falso = widgetFalso();
		const onResult = vi.fn();

		await openWompiWidget(widget, onResult);
		falso.cerrarCon({ transaction: { id: 'tx-9', status: 'DECLINED' } });

		expect(onResult).toHaveBeenCalledWith({ id: 'tx-9', status: 'DECLINED' });
	});

	it('pasa null a onResult si el callback no trae transacción', async () => {
		const falso = widgetFalso();
		const onResult = vi.fn();

		await openWompiWidget(widget, onResult);
		falso.cerrarCon({});

		expect(onResult).toHaveBeenCalledWith(null);
	});
});
