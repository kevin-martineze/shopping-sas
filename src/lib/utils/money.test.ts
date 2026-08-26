import { describe, expect, it } from 'vitest';

import { discountPercent, formatAmount, formatMoney, parseAmount } from '$lib/utils/money';

describe('formatMoney', () => {
	it('formatea pesos colombianos sin decimales', () => {
		expect(formatMoney(89900)).toBe('$89.900');
		expect(formatMoney(1250000)).toBe('$1.250.000');
	});

	it('redondea valores con decimales', () => {
		expect(formatMoney(89900.6)).toBe('$89.901');
	});

	it('maneja el cero', () => {
		expect(formatMoney(0)).toBe('$0');
	});
});

describe('parseAmount', () => {
	it('lee precios escritos con puntos o símbolos', () => {
		expect(parseAmount('89.900')).toBe(89900);
		expect(parseAmount('$ 89 900')).toBe(89900);
		expect(parseAmount('229000')).toBe(229000);
	});

	it('devuelve null cuando no hay dígitos', () => {
		expect(parseAmount('')).toBeNull();
		expect(parseAmount('abc')).toBeNull();
	});
});

describe('formatAmount', () => {
	it('formatea sin símbolo para inputs del panel', () => {
		expect(formatAmount(89900)).toBe('89.900');
	});
});

describe('discountPercent', () => {
	it('calcula el porcentaje de rebaja', () => {
		expect(discountPercent(179000, 199000)).toBe(10);
	});

	it('ignora precios tachados que no son rebaja', () => {
		expect(discountPercent(199000, 199000)).toBeNull();
		expect(discountPercent(199000, 150000)).toBeNull();
		expect(discountPercent(199000, null)).toBeNull();
	});
});
