import { describe, expect, it } from 'vitest';

import { resolveTemplatePreview } from '$lib/server/template-preview';
import { exitPreviewUrl, previewUrl } from '$lib/template-preview';

/** Un frasco de cookies de mentira: lo justo que usa la vista previa. */
function cookieJar(initial: Record<string, string> = {}) {
	const jar = new Map(Object.entries(initial));

	return {
		jar,
		get: (name: string) => jar.get(name),
		set: (name: string, value: string) => {
			jar.set(name, value);
		},
		delete: (name: string) => {
			jar.delete(name);
		}
	};
}

const url = (search: string) => new URL(`https://casaoliva.globerce.store/${search}`);

describe('resolveTemplatePreview', () => {
	it('sin parámetro ni cookie se ve la tienda de verdad', () => {
		const cookies = cookieJar();

		expect(resolveTemplatePreview(url(''), cookies)).toEqual({ template: null, announce: false });
		expect(cookies.jar.size).toBe(0);
	});

	it('?plantilla=boutique la viste, la guarda y la anuncia', () => {
		const cookies = cookieJar();

		expect(resolveTemplatePreview(url('?plantilla=boutique'), cookies)).toEqual({
			template: 'boutique',
			announce: true
		});
		expect(cookies.jar.get('globerce_plantilla')).toBe('boutique');
	});

	it('la cookie mantiene la prueba al navegar dentro de la tienda', () => {
		const cookies = cookieJar({ globerce_plantilla: 'boutique' });

		expect(resolveTemplatePreview(url('producto/blusa-vera'), cookies)).toEqual({
			template: 'boutique',
			announce: true
		});
	});

	it('?plantilla=salir la apaga y borra la cookie', () => {
		const cookies = cookieJar({ globerce_plantilla: 'boutique' });

		expect(resolveTemplatePreview(url('?plantilla=salir'), cookies)).toEqual({
			template: null,
			announce: false
		});
		expect(cookies.jar.has('globerce_plantilla')).toBe(false);
	});

	it('con &solo=1 viste solo esta petición: ni cookie ni aviso', () => {
		const cookies = cookieJar();

		expect(resolveTemplatePreview(url('?plantilla=boutique&solo=1'), cookies)).toEqual({
			template: 'boutique',
			announce: false
		});
		expect(cookies.jar.size).toBe(0);
	});

	it('un código que no existe, en la URL o en la cookie, se ignora', () => {
		expect(resolveTemplatePreview(url('?plantilla=retirada'), cookieJar()).template).toBeNull();
		expect(
			resolveTemplatePreview(url(''), cookieJar({ globerce_plantilla: 'retirada' })).template
		).toBeNull();
	});
});

describe('previewUrl', () => {
	it('arma la dirección de la tienda con la plantilla, y con solo=1 si es miniatura', () => {
		expect(previewUrl('https://casaoliva.globerce.store', 'boutique')).toBe(
			'https://casaoliva.globerce.store/?plantilla=boutique'
		);
		expect(previewUrl('https://casaoliva.globerce.store', 'editorial', true)).toBe(
			'https://casaoliva.globerce.store/?plantilla=editorial&solo=1'
		);
		expect(exitPreviewUrl()).toBe('/?plantilla=salir');
	});
});
