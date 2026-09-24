import { describe, expect, it } from 'vitest';

import {
	cardBrand,
	cardIsEmpty,
	formatCardNumber,
	formatExpiry,
	luhn,
	parseExpiry,
	tokenizeCard,
	validateCard
} from '$lib/domain/card';

/** Números de prueba públicos de las redes. No son de nadie. */
const VISA = '4242424242424242';
const AMEX = '378282246310005';

const ahora = new Date('2026-09-23T00:00:00Z');

describe('cardBrand', () => {
	it('reconoce las marcas por su prefijo', () => {
		expect(cardBrand(VISA)).toBe('visa');
		expect(cardBrand('5555 5555 5555 4444')).toBe('mastercard');
		expect(cardBrand(AMEX)).toBe('amex');
		expect(cardBrand('30569309025904')).toBe('diners');
	});

	it('lo que no reconoce no lo inventa', () => {
		expect(cardBrand('9999999999999999')).toBe('desconocida');
		expect(cardBrand('')).toBe('desconocida');
	});
});

describe('formatCardNumber', () => {
	it('agrupa de a cuatro', () => {
		expect(formatCardNumber(VISA)).toBe('4242 4242 4242 4242');
		expect(formatCardNumber('424242')).toBe('4242 42');
	});

	it('American Express va en 4-6-5, que es como está impresa', () => {
		expect(formatCardNumber(AMEX)).toBe('3782 822463 10005');
	});

	it('ignora lo que no sea dígito', () => {
		expect(formatCardNumber('4242-4242 4242.4242')).toBe('4242 4242 4242 4242');
	});
});

describe('formatExpiry', () => {
	it('mete la barra sola', () => {
		expect(formatExpiry('12')).toBe('12');
		expect(formatExpiry('1228')).toBe('12/28');
		expect(formatExpiry('12/28')).toBe('12/28');
	});

	it('no deja escribir de más', () => {
		expect(formatExpiry('122899')).toBe('12/28');
	});
});

describe('luhn', () => {
	it('acepta los números de prueba de las redes', () => {
		expect(luhn(VISA)).toBe(true);
		expect(luhn(AMEX)).toBe(true);
	});

	it('rechaza un dígito cambiado', () => {
		expect(luhn('4242424242424243')).toBe(false);
	});

	it('rechaza lo que es demasiado corto para ser una tarjeta', () => {
		expect(luhn('4242')).toBe(false);
	});
});

describe('parseExpiry', () => {
	it('vence al final de su mes, no al principio', () => {
		// Estamos en septiembre de 2026: una tarjeta de 09/26 todavía sirve.
		expect(parseExpiry('09/26', ahora)).toEqual({ month: 9, year: 26 });
		expect(parseExpiry('08/26', ahora)).toBeNull();
	});

	it('un mes que no existe no es una fecha', () => {
		expect(parseExpiry('13/28', ahora)).toBeNull();
		expect(parseExpiry('00/28', ahora)).toBeNull();
	});

	it('incompleta no es válida', () => {
		expect(parseExpiry('9/28', ahora)).toBeNull();
		expect(parseExpiry('', ahora)).toBeNull();
	});
});

describe('validateCard', () => {
	const buena = { number: VISA, expiry: '09/29', cvc: '123', holder: 'Maria Restrepo' };

	it('una tarjeta bien escrita no tiene nada que decir', () => {
		expect(validateCard(buena, ahora)).toEqual({});
	});

	it('señala cada campo por separado', () => {
		const errors = validateCard({ number: '4242', expiry: '01/20', cvc: '1', holder: 'M' }, ahora);

		expect(Object.keys(errors).sort()).toEqual(['cvc', 'expiry', 'holder', 'number']);
	});

	it('el código de American Express son cuatro dígitos', () => {
		expect(validateCard({ ...buena, number: AMEX, cvc: '123' }, ahora).cvc).toContain('4');
		expect(validateCard({ ...buena, number: AMEX, cvc: '1234' }, ahora).cvc).toBeUndefined();
	});
});

describe('cardIsEmpty', () => {
	it('distingue no haberla tocado de haberla escrito mal', () => {
		expect(cardIsEmpty({ number: '', expiry: '', cvc: '', holder: '  ' })).toBe(true);
		expect(cardIsEmpty({ number: '4', expiry: '', cvc: '', holder: '' })).toBe(false);
	});
});

describe('tokenizeCard', () => {
	const buena = { number: VISA, expiry: '09/29', cvc: '123', holder: 'Maria Restrepo' };

	it('sin pasarela no llama a nadie y arma el token con los cuatro últimos', async () => {
		// `api_url` vacío es la pasarela simulada. Si esto llamara a alguien, en
		// desarrollo la petición se iría contra nuestro propio sitio.
		await expect(tokenizeCard({ api_url: '', public_key: 'pub_simulado' }, buena)).resolves.toBe(
			'sim_4242'
		);
	});

	it('una fecha imposible ni se manda', async () => {
		await expect(
			tokenizeCard({ api_url: '', public_key: 'pub_simulado' }, { ...buena, expiry: '13/99' })
		).rejects.toThrow('vencimiento');
	});
});
