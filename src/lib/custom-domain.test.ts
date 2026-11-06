import { describe, expect, it } from 'vitest';

import { customDomainRedirect, esVistaPrevia, redirectToCustomDomain } from '$lib/custom-domain';

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

describe('redirectToCustomDomain', () => {
	const args = {
		currentHost: 'boutique.globerce.store',
		pathname: '/tienda',
		search: '?q=1',
		rootDomain: 'globerce.store',
		platformHosts: []
	};

	it('un subdominio con dominio propio activo va al dominio propio, con 302', () => {
		expect(redirectToCustomDomain({ ...args, publicUrl: 'https://www.sutienda.com' })).toBe(
			'https://www.sutienda.com/tienda?q=1'
		);
	});

	it('si la tienda sigue en el subdominio, no redirige', () => {
		expect(
			redirectToCustomDomain({ ...args, publicUrl: 'https://boutique.globerce.store' })
		).toBeNull();
	});

	it('un dominio propio que pide la tienda no vuelve a redirigir', () => {
		expect(
			redirectToCustomDomain({
				...args,
				currentHost: 'www.sutienda.com',
				publicUrl: 'https://www.sutienda.com'
			})
		).toBeNull();
	});
});

describe('esVistaPrevia', () => {
	const sinPreview = { secFetchDest: null, pathname: '/tienda', preview: false };

	it('una visita normal no es vista previa', () => {
		expect(esVistaPrevia(sinPreview)).toBe(false);
	});

	it('un iframe es vista previa, aunque la ruta sea de la tienda', () => {
		expect(esVistaPrevia({ ...sinPreview, secFetchDest: 'iframe' })).toBe(true);
		expect(esVistaPrevia({ ...sinPreview, secFetchDest: 'document' })).toBe(false);
	});

	it('las rutas /vista-previa son vista previa', () => {
		expect(esVistaPrevia({ ...sinPreview, pathname: '/vista-previa' })).toBe(true);
		expect(esVistaPrevia({ ...sinPreview, pathname: '/vista-previa/carrito' })).toBe(true);
		expect(esVistaPrevia({ ...sinPreview, pathname: '/vista-previas' })).toBe(false);
	});

	it('una plantilla o tema en prueba es vista previa', () => {
		expect(esVistaPrevia({ ...sinPreview, preview: true })).toBe(true);
	});
});

describe('redirectToCustomDomain con skip', () => {
	const args = {
		currentHost: 'boutique.globerce.store',
		publicUrl: 'https://www.sutienda.com',
		pathname: '/tienda',
		search: '',
		rootDomain: 'globerce.store',
		platformHosts: []
	};

	it('con skip no redirige, aunque el dominio propio esté activo', () => {
		expect(redirectToCustomDomain({ ...args, skip: true })).toBeNull();
	});

	it('sin skip redirige', () => {
		expect(redirectToCustomDomain({ ...args, skip: false })).toBe(
			'https://www.sutienda.com/tienda'
		);
	});
});
