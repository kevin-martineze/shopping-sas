import type { AppliedCoupon, ShippingZone, StoreSettings } from '$lib/domain/settings';

import { describe, expect, it } from 'vitest';

import { computeTotals, parseCartPayload } from '$lib/server/cart';

const settings: StoreSettings = {
	store_name: 'Atelier',
	whatsapp_phone: '573000000000',
	instagram_url: null,
	announcement: null,
	free_shipping_threshold: null
};

const zone: ShippingZone = {
	id: 'zone-1',
	name: 'Bogotá',
	cost: 8000,
	eta_days: 2,
	active: true,
	sort_order: 1
};

describe('computeTotals', () => {
	it('suma el envío cuando no hay descuento', () => {
		expect(computeTotals(189000, null, zone, settings)).toEqual({
			subtotal: 189000,
			discount: 0,
			shippingCost: 8000,
			total: 197000
		});
	});

	it('aplica el cupón antes del envío', () => {
		const coupon: AppliedCoupon = {
			code: 'BIENVENIDA10',
			type: 'percent',
			value: 10,
			discount: 18900
		};

		expect(computeTotals(189000, coupon, zone, settings)).toEqual({
			subtotal: 189000,
			discount: 18900,
			shippingCost: 8000,
			total: 178100
		});
	});

	it('nunca descuenta más que el subtotal', () => {
		const coupon: AppliedCoupon = {
			code: 'GRANDE',
			type: 'fixed',
			value: 500000,
			discount: 500000
		};

		expect(computeTotals(189000, coupon, zone, settings).discount).toBe(189000);
		expect(computeTotals(189000, coupon, zone, settings).total).toBe(8000);
	});

	it('libera el envío al superar el umbral, ya con el descuento aplicado', () => {
		const withThreshold = { ...settings, free_shipping_threshold: 250000 };
		const coupon: AppliedCoupon = { code: 'DIEZ', type: 'fixed', value: 20000, discount: 20000 };

		// 260.000 - 20.000 = 240.000: todavía no alcanza el umbral.
		expect(computeTotals(260000, coupon, zone, withThreshold).shippingCost).toBe(8000);

		// 280.000 - 20.000 = 260.000: envío gratis.
		expect(computeTotals(280000, coupon, zone, withThreshold).shippingCost).toBe(0);
	});

	it('sin zona elegida el envío es cero', () => {
		expect(computeTotals(100000, null, null, settings).shippingCost).toBe(0);
	});
});

describe('parseCartPayload', () => {
	it('acepta líneas válidas', () => {
		const raw = JSON.stringify([{ variantId: 'a', qty: 2 }]);

		expect(parseCartPayload(raw)).toEqual([{ variantId: 'a', qty: 2 }]);
	});

	it('descarta basura y cantidades imposibles', () => {
		const raw = JSON.stringify([
			{ variantId: 'a', qty: 0 },
			{ variantId: 'b', qty: -3 },
			{ variantId: 42, qty: 1 },
			null,
			{ qty: 1 },
			{ variantId: 'c', qty: 999 }
		]);

		expect(parseCartPayload(raw)).toEqual([{ variantId: 'c', qty: 20 }]);
	});

	it('tolera JSON inválido o ausente', () => {
		expect(parseCartPayload('no-json')).toEqual([]);
		expect(parseCartPayload(null)).toEqual([]);
		expect(parseCartPayload(JSON.stringify({ variantId: 'a' }))).toEqual([]);
	});
});
