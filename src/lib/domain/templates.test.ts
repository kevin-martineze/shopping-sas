import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
	DEFAULT_TEMPLATE,
	STOREFRONT_TEMPLATES,
	TEMPLATES,
	templateOf
} from '$lib/domain/templates';

describe('plantillas', () => {
	it('toda plantilla del catálogo tiene su ficha, y al revés', () => {
		expect(TEMPLATES.map((template) => template.code)).toEqual([...STOREFRONT_TEMPLATES]);
		expect(TEMPLATES.every((template) => template.features.length > 0)).toBe(true);
	});

	it('la de por defecto es la primera: es la que ve una tienda sin elegir', () => {
		expect(templateOf(DEFAULT_TEMPLATE).code).toBe(DEFAULT_TEMPLATE);
		expect(TEMPLATES[0]?.code).toBe(DEFAULT_TEMPLATE);
	});

	it('un código desconocido cae en la de por defecto en vez de romper la tienda', () => {
		expect(templateOf('retirada-hace-un-año').code).toBe(DEFAULT_TEMPLATE);
		expect(templateOf(null).code).toBe(DEFAULT_TEMPLATE);
		expect(templateOf(undefined).code).toBe(DEFAULT_TEMPLATE);
	});
});

describe('plantilla moda', () => {
	it('existe en el catálogo y se resuelve por su código', () => {
		expect(STOREFRONT_TEMPLATES).toContain('moda');
		expect(templateOf('moda').code).toBe('moda');
		expect(templateOf('moda').name).toBe('Moda');
	});

	it('usa la cabecera mega, la tarjeta retail y filas en carrusel', () => {
		const moda = templateOf('moda');

		expect(moda.header).toBe('mega');
		expect(moda.card).toBe('retail');
		expect(moda.shelves).toBe('carousel');
	});

	it('todas las plantillas existentes siguen con la portada en grilla', () => {
		for (const template of TEMPLATES.filter((item) => item.code !== 'moda')) {
			expect(template.shelves).toBe('grid');
		}
	});

	it('su fondo es el mismo blanco que su bloque en app.css', () => {
		const css = readFileSync(resolve(process.cwd(), 'src/app.css'), 'utf8');
		const block = css.slice(css.indexOf("[data-storefront-template='moda'] {"));
		const background = /--background: oklch\(1 0 0\);/.exec(block);

		expect(background).not.toBeNull();
		expect(templateOf('moda').background).toBe('#FFFFFF');
	});
});
