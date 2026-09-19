import { describe, expect, it } from 'vitest';

import { storefrontUrl, storeSlugFromHost } from '$lib/tenant';

describe('storeSlugFromHost', () => {
	it('lee la tienda del subdominio, con o sin puerto', () => {
		expect(storeSlugFromHost('boutique.globerce.com', 'globerce.com', undefined)).toBe('boutique');
		expect(storeSlugFromHost('Boutique.localhost:5173', 'localhost:5173', 'otra')).toBe('boutique');
	});

	it('el dominio raíz y los hosts ajenos caen en la tienda por defecto', () => {
		expect(storeSlugFromHost('globerce.com', 'globerce.com', 'nombre')).toBe('nombre');
		expect(storeSlugFromHost('otro.com', 'globerce.com', 'nombre')).toBe('nombre');
		expect(storeSlugFromHost('globerce.com', 'globerce.com', undefined)).toBeNull();
	});

	it('no acepta subdominios reservados, anidados ni con otro formato', () => {
		expect(storeSlugFromHost('www.globerce.com', 'globerce.com', undefined)).toBeNull();
		expect(storeSlugFromHost('a.b.globerce.com', 'globerce.com', undefined)).toBeNull();
		expect(storeSlugFromHost('x.globerce.com', 'globerce.com', undefined)).toBeNull();
		expect(storeSlugFromHost('evilgloberce.com', 'globerce.com', undefined)).toBeNull();
	});

	it('sin dominio raíz, todo host es la tienda por defecto', () => {
		expect(storeSlugFromHost('boutique.globerce.com', undefined, 'nombre')).toBe('nombre');
	});
});

describe('storefrontUrl', () => {
	it('arma el subdominio con el protocolo del sitio', () => {
		expect(storefrontUrl('boutique', 'globerce.com', 'https://globerce.com')).toBe(
			'https://boutique.globerce.com'
		);
	});

	it('sin dominio raíz es el propio sitio', () => {
		expect(storefrontUrl('boutique', undefined, 'http://localhost:5173/')).toBe(
			'http://localhost:5173'
		);
	});
});
