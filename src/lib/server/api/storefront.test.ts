import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '$lib/server/api/client';
import { findStoreByDomain } from '$lib/server/api/storefront';

vi.mock('$lib/server/api/client', () => ({ apiRequest: vi.fn() }));

const noEncontrada = {
	ok: false as const,
	status: 404,
	code: 'not_found',
	message: 'Esta tienda no existe.',
	details: undefined
};

describe('findStoreByDomain', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(apiRequest).mockResolvedValue(noEncontrada);
	});

	it('consulta la ruta del host con la IP de la visitante, sin el slug de la tienda', async () => {
		const result = await findStoreByDomain('sutienda.com', '203.0.113.7');

		const [path, , options] = vi.mocked(apiRequest).mock.calls[0];

		expect(path).toBe('/store-domains/sutienda.com');
		expect(options).toEqual({ clientIp: '203.0.113.7' });
		expect(result).toEqual(noEncontrada);
	});

	it('la respuesta acepta los cuatro estados del dominio', async () => {
		await findStoreByDomain('sutienda.com', null);

		const [, schema] = vi.mocked(apiRequest).mock.calls[0];

		for (const status of ['pending', 'active', 'failed', 'disabled']) {
			expect(schema.safeParse({ slug: 'boutique', status }).success).toBe(true);
		}
		expect(schema.safeParse({ slug: 'boutique', status: 'paused' }).success).toBe(false);
		expect(schema.safeParse({ status: 'active' }).success).toBe(false);
	});
});
