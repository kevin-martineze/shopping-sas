import { describe, expect, it } from 'vitest';

import { storefrontUrl, storeSlugFromHost } from '$lib/server/tenant';

describe('storeSlugFromHost', () => {
	it('lee la tienda del subdominio, con o sin puerto', () => {
		expect(storeSlugFromHost('boutique.mitienda.com', 'mitienda.com', undefined)).toBe('boutique');
		expect(storeSlugFromHost('Boutique.localhost:5173', 'localhost:5173', 'otra')).toBe('boutique');
	});

	it('el dominio raíz y los hosts ajenos caen en la tienda por defecto', () => {
		expect(storeSlugFromHost('mitienda.com', 'mitienda.com', 'nombre')).toBe('nombre');
		expect(storeSlugFromHost('otro.com', 'mitienda.com', 'nombre')).toBe('nombre');
		expect(storeSlugFromHost('mitienda.com', 'mitienda.com', undefined)).toBeNull();
	});

	it('no acepta subdominios reservados, anidados ni con otro formato', () => {
		expect(storeSlugFromHost('www.mitienda.com', 'mitienda.com', undefined)).toBeNull();
		expect(storeSlugFromHost('a.b.mitienda.com', 'mitienda.com', undefined)).toBeNull();
		expect(storeSlugFromHost('x.mitienda.com', 'mitienda.com', undefined)).toBeNull();
		expect(storeSlugFromHost('evilmitienda.com', 'mitienda.com', undefined)).toBeNull();
	});

	it('sin dominio raíz, todo host es la tienda por defecto', () => {
		expect(storeSlugFromHost('boutique.mitienda.com', undefined, 'nombre')).toBe('nombre');
	});
});

describe('storefrontUrl', () => {
	it('arma el subdominio con el protocolo del sitio', () => {
		expect(storefrontUrl('boutique', 'mitienda.com', 'https://mitienda.com')).toBe(
			'https://boutique.mitienda.com'
		);
	});

	it('sin dominio raíz es el propio sitio', () => {
		expect(storefrontUrl('boutique', undefined, 'http://localhost:5173/')).toBe(
			'http://localhost:5173'
		);
	});
});
