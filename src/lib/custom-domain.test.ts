import { describe, expect, it } from 'vitest';

import { customDomainRedirect } from '$lib/custom-domain';

const base = {
	slug: 'boutique',
	pathname: '/tienda/vestidos',
	search: '?orden=precio',
	isSharedPath: false,
	rootDomain: 'globerce.store',
	siteUrl: 'https://globerce.store'
};

describe('customDomainRedirect', () => {
	it('una tienda activa en una ruta de la tienda se sirve tal cual', () => {
		expect(customDomainRedirect({ ...base, domainStatus: 'active' })).toBeNull();
	});

	it('una tienda no activa va al subdominio con 302, nunca 308', () => {
		for (const domainStatus of ['pending', 'failed', 'disabled'] as const) {
			expect(customDomainRedirect({ ...base, domainStatus })).toEqual({
				status: 302,
				location: 'https://boutique.globerce.store/tienda/vestidos?orden=precio'
			});
		}
	});

	it('el panel, el login y el registro van al subdominio con 308, sea cual sea el estado', () => {
		const panel = { ...base, pathname: '/admin/pedidos', search: '', isSharedPath: true };

		expect(customDomainRedirect({ ...panel, domainStatus: 'active' })).toEqual({
			status: 308,
			location: 'https://boutique.globerce.store/admin/pedidos'
		});
		expect(customDomainRedirect({ ...panel, domainStatus: 'pending' })?.status).toBe(308);
	});

	it('sin dominio raíz, la tienda se enlaza por el sitio', () => {
		expect(
			customDomainRedirect({
				...base,
				rootDomain: undefined,
				domainStatus: 'pending',
				siteUrl: 'http://localhost:5173/'
			})
		).toEqual({
			status: 302,
			location: 'http://localhost:5173/tienda/vestidos?orden=precio'
		});
	});
});
