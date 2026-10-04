import type { StoreTheme } from '$lib/domain/theme';

import { describe, expect, it } from 'vitest';

import { resolveTemplatePreview } from '$lib/server/template-preview';
import { EMPTY_THEME } from '$lib/domain/theme';
import { exitPreviewUrl, previewUrl, themePreviewUrl } from '$lib/template-preview';

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

		expect(resolveTemplatePreview(url(''), cookies)).toEqual({
			template: null,
			announce: false,
			theme: null
		});
		expect(cookies.jar.size).toBe(0);
	});

	it('?plantilla=boutique la viste, la guarda y la anuncia', () => {
		const cookies = cookieJar();

		expect(resolveTemplatePreview(url('?plantilla=boutique'), cookies)).toEqual({
			template: 'boutique',
			announce: true,
			theme: null
		});
		expect(cookies.jar.get('globerce_plantilla')).toBe('boutique');
	});

	it('la cookie mantiene la prueba al navegar dentro de la tienda', () => {
		const cookies = cookieJar({ globerce_plantilla: 'boutique' });

		expect(resolveTemplatePreview(url('producto/blusa-vera'), cookies)).toEqual({
			template: 'boutique',
			announce: true,
			theme: null
		});
	});

	it('?plantilla=salir la apaga y borra la cookie', () => {
		const cookies = cookieJar({ globerce_plantilla: 'boutique' });

		expect(resolveTemplatePreview(url('?plantilla=salir'), cookies)).toEqual({
			template: null,
			announce: false,
			theme: null
		});
		expect(cookies.jar.has('globerce_plantilla')).toBe(false);
	});

	it('con &solo=1 viste solo esta petición: ni cookie ni aviso', () => {
		const cookies = cookieJar();

		expect(resolveTemplatePreview(url('?plantilla=boutique&solo=1'), cookies)).toEqual({
			template: 'boutique',
			announce: false,
			theme: null
		});
		expect(cookies.jar.size).toBe(0);
	});

	it('con solo=1 y ajustes=1 trae los ajustes del borrador, sin los que no reconoce', () => {
		const cookies = cookieJar();
		const preview = resolveTemplatePreview(
			url('?plantilla=boutique&solo=1&ajustes=1&color=%231d4ed8&letras=comic&esquinas=round'),
			cookies
		);

		expect(preview.theme).toEqual({
			accent: '#1D4ED8',
			fonts: null,
			corners: 'round',
			hero: null
		});
		expect(cookies.jar.size).toBe(0);
	});

	it('los ajustes de la URL no valen fuera de la miniatura', () => {
		expect(
			resolveTemplatePreview(url('?plantilla=boutique&ajustes=1&color=%23000000'), cookieJar())
				.theme
		).toBeNull();
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

describe('themePreviewUrl', () => {
	it('lleva solo los ajustes que hay, y vuelve a leerse igual', () => {
		const theme: StoreTheme = { ...EMPTY_THEME, accent: '#1D4ED8', hero: 'split' };
		const built = new URL(themePreviewUrl('https://casaoliva.globerce.store', 'galeria', theme));

		expect(built.searchParams.get('plantilla')).toBe('galeria');
		expect(built.searchParams.get('solo')).toBe('1');
		expect(built.searchParams.get('letras')).toBeNull();
		expect(resolveTemplatePreview(built, cookieJar()).theme).toEqual(theme);
	});
});
