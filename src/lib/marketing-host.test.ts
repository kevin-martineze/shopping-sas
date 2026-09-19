import { describe, expect, it } from 'vitest';

import { isSharedPath, MARKETING_HOME, rerouteForHost } from '$lib/marketing-host';

describe('rerouteForHost', () => {
	it('en el dominio raíz, la portada es el sitio comercial', () => {
		expect(rerouteForHost({ pathname: '/', storeSlug: null })).toBe(MARKETING_HOME);
	});

	it('en el host de una tienda, la portada sigue siendo la tienda', () => {
		expect(rerouteForHost({ pathname: '/', storeSlug: 'mariposa' })).toBeUndefined();
	});

	it('el sitio comercial no se abre desde una tienda', () => {
		expect(rerouteForHost({ pathname: MARKETING_HOME, storeSlug: 'mariposa' })).toBe('/no-existe');
	});

	it('las demás rutas quedan como están', () => {
		for (const slug of [null, 'mariposa']) {
			expect(rerouteForHost({ pathname: '/registro', storeSlug: slug })).toBeUndefined();
			expect(rerouteForHost({ pathname: '/admin/productos', storeSlug: slug })).toBeUndefined();
		}
	});
});

describe('isSharedPath', () => {
	it('el panel, la consola y el registro responden en cualquier host', () => {
		expect(isSharedPath('/admin')).toBe(true);
		expect(isSharedPath('/admin/pedidos/1')).toBe(true);
		expect(isSharedPath('/plataforma/tiendas')).toBe(true);
		expect(isSharedPath('/registro')).toBe(true);
	});

	it('la tienda no', () => {
		expect(isSharedPath('/tienda')).toBe(false);
		expect(isSharedPath('/administrar')).toBe(false);
	});
});

describe('las páginas legales', () => {
	it('se sirven en el dominio raíz y no existen en una tienda', () => {
		expect(rerouteForHost({ pathname: '/terminos', storeSlug: null })).toBeUndefined();
		expect(rerouteForHost({ pathname: '/privacidad', storeSlug: 'boutique' })).toBe('/no-existe');
		expect(rerouteForHost({ pathname: '/contacto', storeSlug: 'boutique' })).toBe('/no-existe');
	});
});
