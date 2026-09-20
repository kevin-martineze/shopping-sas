import { describe, expect, it } from 'vitest';

import { DEFAULT_COUNTRY, dialOf, joinPhone, splitPhone } from '$lib/domain/phone';

describe('joinPhone', () => {
	it('pega el indicativo al número local', () => {
		expect(joinPhone('CO', '3001234567')).toBe('573001234567');
	});

	it('quita lo que no sea dígito: la gente escribe espacios y guiones', () => {
		expect(joinPhone('CO', '300 123-4567')).toBe('573001234567');
	});

	it('sin número no inventa uno con solo el indicativo', () => {
		expect(joinPhone('CO', '')).toBe('');
		expect(joinPhone('CO', '   ')).toBe('');
	});

	it('un país desconocido cae en el de por defecto, no en nada', () => {
		expect(joinPhone('XX', '3001234567')).toBe(joinPhone(DEFAULT_COUNTRY, '3001234567'));
	});
});

describe('splitPhone', () => {
	it('deshace lo que hizo joinPhone', () => {
		expect(splitPhone('573001234567')).toEqual({ code: 'CO', number: '3001234567' });
	});

	it('prefiere el indicativo más largo que encaje', () => {
		// 593 (Ecuador) empieza por 59, que no es de nadie, pero 5 sí podría
		// serlo en otra lista: gana el más específico.
		expect(splitPhone('593991234567').code).toBe('EC');
	});

	it('vacío devuelve el país por defecto y ningún número', () => {
		expect(splitPhone('')).toEqual({ code: DEFAULT_COUNTRY, number: '' });
	});

	it('un número sin indicativo conocido se conserva entero', () => {
		expect(splitPhone('999888777')).toEqual({ code: DEFAULT_COUNTRY, number: '999888777' });
	});
});

describe('dialOf', () => {
	it('devuelve el indicativo del país', () => {
		expect(dialOf('MX')).toBe('52');
	});
});
