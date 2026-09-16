import { describe, expect, it } from 'vitest';

import { safeRedirectTarget } from '$lib/utils/redirect';

describe('safeRedirectTarget', () => {
	it('acepta rutas del propio sitio, con su query', () => {
		expect(safeRedirectTarget('/admin/productos?q=vestido')).toBe('/admin/productos?q=vestido');
	});

	it('cae al panel cuando no hay destino', () => {
		expect(safeRedirectTarget(null)).toBe('/admin');
		expect(safeRedirectTarget('')).toBe('/admin');
	});

	it('rechaza cualquier destino que salga del sitio', () => {
		for (const target of [
			'https://otro-sitio.test',
			'//otro-sitio.test',
			'/\\otro-sitio.test',
			'javascript:alert(1)'
		]) {
			expect(safeRedirectTarget(target)).toBe('/admin');
		}
	});
});
