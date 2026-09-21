import { describe, expect, it } from 'vitest';

import { slugify } from '$lib/utils/slug';

describe('slugify', () => {
	it('quita tildes y espacios', () => {
		expect(slugify('Índigo Oscuro')).toBe('indigo-oscuro');
		expect(slugify('Blusa Vera')).toBe('blusa-vera');
	});

	it('normaliza signos y mayúsculas', () => {
		expect(slugify('Falda   Plisada / Inés')).toBe('falda-plisada-ines');
		expect(slugify('¡Oferta! 50%')).toBe('oferta-50');
	});

	it('no deja guiones sueltos en los extremos', () => {
		expect(slugify('  -- Abrigo --  ')).toBe('abrigo');
	});

	it('devuelve cadena vacía cuando no queda nada utilizable', () => {
		expect(slugify('¿¡!?')).toBe('');
	});

	it('recorta nombres larguísimos', () => {
		expect(slugify('a'.repeat(120)).length).toBe(80);
	});
});
