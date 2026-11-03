import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WompiWidget } from '$lib/domain/wompi';

import { esWidget, openWompiWidget, pagoConWidget } from '$lib/utils/wompi-widget';

const widgetValido = {
	public_key: 'pub_test_llave_publica',
	currency: 'COP',
	amount_in_cents: 4550000,
	reference: 'ord-1',
	integrity_signature: 'firma-de-integridad',
	redirect_url: 'http://localhost:5173/pedido/1',
	customer_email: null
};

describe('esWidget', () => {
	it('acepta un widget completo, con o sin email', () => {
		expect(esWidget(widgetValido)).toBe(true);
		expect(esWidget({ ...widgetValido, customer_email: 'clienta@example.com' })).toBe(true);
	});

	it('rechaza lo que no tiene la forma o la moneda', () => {
		expect(esWidget(null)).toBe(false);
		expect(esWidget('widget')).toBe(false);
		expect(esWidget({ ...widgetValido, currency: 'USD' })).toBe(false);
		expect(esWidget({ ...widgetValido, amount_in_cents: '4550000' })).toBe(false);
	});
});

describe('pagoConWidget', () => {
	it('lee el widget y la URL de respaldo de una action exitosa', () => {
		const pago = pagoConWidget({
			type: 'success',
			status: 200,
			data: { widget: widgetValido, url: 'https://checkout.wompi.co/p/?x=1' }
		});

		expect(pago?.widget).toEqual(widgetValido);
		expect(pago?.url).toBe('https://checkout.wompi.co/p/?x=1');
	});

	it('sin widget, o con uno mal formado, no hay pago con widget', () => {
		expect(
			pagoConWidget({ type: 'success', status: 200, data: { url: 'https://x.co' } })
		).toBeNull();
		expect(
			pagoConWidget({ type: 'success', status: 200, data: { widget: null, url: 'https://x.co' } })
		).toBeNull();
	});

	it('si la action falla o redirige, no hay pago con widget', () => {
		expect(
			pagoConWidget({ type: 'failure', status: 400, data: { error: 'Elige un plan.' } })
		).toBeNull();
		expect(pagoConWidget({ type: 'redirect', status: 303, location: '/admin/plan' })).toBeNull();
	});
});

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
