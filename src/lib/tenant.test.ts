import { describe, expect, it } from 'vitest';

import {
	hostServesStore,
	parsePlatformHosts,
	resolveHost,
	sessionCookieDomain,
	storefrontUrl,
	storeSlugFromHost
} from '$lib/tenant';

describe('resolveHost', () => {
	it('el dominio raíz y www son la plataforma', () => {
		expect(resolveHost('globerce.com', 'globerce.com')).toEqual({ kind: 'platform' });
		expect(resolveHost('www.globerce.com', 'globerce.com')).toEqual({ kind: 'platform' });
	});

	it('un subdominio válido es una tienda, con o sin puerto', () => {
		expect(resolveHost('boutique.globerce.com', 'globerce.com')).toEqual({
			kind: 'store',
			slug: 'boutique'
		});
		expect(resolveHost('Boutique.localhost:5173', 'localhost:5173')).toEqual({
			kind: 'store',
			slug: 'boutique'
		});
	});

	it('los subdominios reservados y los anidados son de la plataforma, no tiendas', () => {
		expect(resolveHost('api.globerce.com', 'globerce.com')).toEqual({ kind: 'platform' });
		expect(resolveHost('a.b.globerce.com', 'globerce.com')).toEqual({ kind: 'platform' });
		expect(resolveHost('x.globerce.com', 'globerce.com')).toEqual({ kind: 'platform' });
	});

	it('localhost y *.localhost son la plataforma, salvo una tienda válida', () => {
		expect(resolveHost('localhost:5173', 'localhost:5173')).toEqual({ kind: 'platform' });
		expect(resolveHost('localhost', undefined)).toEqual({ kind: 'platform' });
		expect(resolveHost('app.localhost:5173', 'localhost:5173')).toEqual({ kind: 'platform' });
	});

	it('*.vercel.app es la plataforma', () => {
		expect(resolveHost('globerce-git-main.vercel.app', 'globerce.com')).toEqual({
			kind: 'platform'
		});
	});

	it('los hosts de PUBLIC_PLATFORM_HOSTS son la plataforma', () => {
		const plataforma = parsePlatformHosts('globerce.store, Otro.dev.');

		expect(resolveHost('otro.dev:443', 'globerce.com', plataforma)).toEqual({ kind: 'platform' });
	});

	it('cualquier otro host es un dominio propio, normalizado', () => {
		expect(resolveHost('WWW.SuTienda.com.', 'globerce.com')).toEqual({
			kind: 'custom',
			host: 'www.sutienda.com'
		});
		expect(resolveHost('sutienda.com:8080', 'globerce.com')).toEqual({
			kind: 'custom',
			host: 'sutienda.com'
		});
	});

	it('sin dominio raíz, los hosts de la plataforma siguen siendo la plataforma', () => {
		expect(resolveHost('localhost:5173', undefined)).toEqual({ kind: 'platform' });
		expect(resolveHost('sutienda.com', undefined)).toEqual({
			kind: 'custom',
			host: 'sutienda.com'
		});
	});
});

describe('storeSlugFromHost', () => {
	it('lee la tienda del subdominio', () => {
		expect(storeSlugFromHost('boutique.globerce.com', 'globerce.com', undefined)).toBe('boutique');
	});

	it('la plataforma cae en la tienda por defecto', () => {
		expect(storeSlugFromHost('globerce.com', 'globerce.com', 'nombre')).toBe('nombre');
		expect(storeSlugFromHost('localhost:5173', 'localhost:5173', 'nombre')).toBe('nombre');
		expect(storeSlugFromHost('globerce.com', 'globerce.com', undefined)).toBeNull();
	});

	it('un dominio propio no cae en la tienda por defecto: su slug lo busca la API', () => {
		expect(storeSlugFromHost('sutienda.com', 'globerce.com', 'nombre')).toBeNull();
	});

	it('sin dominio raíz, todo subdominio se lee como un host propio', () => {
		expect(storeSlugFromHost('boutique.globerce.com', undefined, 'nombre')).toBeNull();
	});
});

describe('hostServesStore', () => {
	it('un subdominio y un dominio propio sirven tienda', () => {
		expect(hostServesStore({ kind: 'store', slug: 'boutique' }, undefined)).toBe(true);
		expect(hostServesStore({ kind: 'custom', host: 'sutienda.com' }, undefined)).toBe(true);
	});

	it('la plataforma sirve tienda solo si hay tienda por defecto', () => {
		expect(hostServesStore({ kind: 'platform' }, 'nombre')).toBe(true);
		expect(hostServesStore({ kind: 'platform' }, undefined)).toBe(false);
		expect(hostServesStore({ kind: 'platform' }, '  ')).toBe(false);
	});
});

describe('parsePlatformHosts', () => {
	it('separa por comas, normaliza y descarta vacíos', () => {
		expect(parsePlatformHosts(' globerce.store , Mi.Dev:3000,, ')).toEqual([
			'globerce.store',
			'mi.dev'
		]);
	});

	it('sin valor no hay hosts de plataforma extra', () => {
		expect(parsePlatformHosts(undefined)).toEqual([]);
		expect(parsePlatformHosts('')).toEqual([]);
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

describe('sessionCookieDomain', () => {
	it('con dominio raíz, la sesión vale en todos sus subdominios', () => {
		expect(sessionCookieDomain('globerce.store')).toBe('.globerce.store');
	});

	it('en desarrollo la cookie es del host: localhost no sirve como dominio', () => {
		expect(sessionCookieDomain('localhost:5173')).toBeUndefined();
		expect(sessionCookieDomain('localhost')).toBeUndefined();
		expect(sessionCookieDomain(undefined)).toBeUndefined();
		expect(sessionCookieDomain('  ')).toBeUndefined();
	});
});
