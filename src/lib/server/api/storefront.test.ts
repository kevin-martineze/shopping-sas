import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiRequest } from '$lib/server/api/client';
import { findStoreByDomain, getStorefront } from '$lib/server/api/storefront';

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

describe('getStorefront: logo de la tienda', () => {
	const vitrina = {
		store: { name: 'Boutique', publicUrl: 'https://boutique.globerce.store' },
		settings: {
			whatsappPhone: '573001234567',
			instagramUrl: null,
			announcement: null,
			freeShippingThreshold: null,
			heroCollectionId: null,
			heroTitle: null,
			heroSubtitle: null,
			template: 'editorial',
			theme: { accent: null, fonts: null, corners: null, hero: null },
			assistant: false,
			onlinePayments: false
		},
		categories: [],
		collections: []
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(apiRequest).mockResolvedValue(noEncontrada);
	});

	async function leeEsquema() {
		await getStorefront({ storeSlug: 'boutique', clientIp: null });

		const [, schema] = vi.mocked(apiRequest).mock.calls[0];

		return schema;
	}

	it('acepta la vitrina con logo y la expone como logo_url', async () => {
		const schema = await leeEsquema();
		const logoUrl = 'https://cdn.globerce.store/stores/x/branding/logo/abc.webp';

		const result = schema.safeParse({ ...vitrina, settings: { ...vitrina.settings, logoUrl } });

		expect(result).toMatchObject({ success: true, data: { settings: { logo_url: logoUrl } } });
	});

	it('acepta la vitrina sin logoUrl (API anterior) y deja logo_url en null', async () => {
		const schema = await leeEsquema();

		const result = schema.safeParse(vitrina);

		expect(result).toMatchObject({ success: true, data: { settings: { logo_url: null } } });
	});
});
