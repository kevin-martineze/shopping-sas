import { describe, expect, it } from 'vitest';

import { parseCartPayload } from '$lib/server/cart';

// Los totales (cupón, envío, umbral de envío gratis) ya no se calculan aquí: los
// calcula la API y los prueba `ecommerce-api/src/shared/commerce/pricing.spec.ts`.

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
