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
