import { describe, expect, it } from 'vitest';

import { esperaDesde } from '$lib/domain/support';

const AHORA = new Date('2026-11-03T12:00:00.000Z');

function hace(minutos: number): string {
	return new Date(AHORA.getTime() - minutos * 60_000).toISOString();
}

describe('esperaDesde', () => {
	it('habla en minutos mientras no pasa la hora', () => {
		expect(esperaDesde(hace(0), AHORA)).toBe('hace 0 min');
		expect(esperaDesde(hace(45), AHORA)).toBe('hace 45 min');
	});

	it('pasa a horas y luego a días', () => {
		expect(esperaDesde(hace(120), AHORA)).toBe('hace 2 h');
		expect(esperaDesde(hace(60 * 23), AHORA)).toBe('hace 23 h');
		expect(esperaDesde(hace(60 * 24), AHORA)).toBe('hace 1 día');
		expect(esperaDesde(hace(60 * 24 * 3), AHORA)).toBe('hace 3 días');
	});

	it('una fecha futura no da una espera negativa', () => {
		expect(esperaDesde(new Date(AHORA.getTime() + 5 * 60_000).toISOString(), AHORA)).toBe(
			'hace 0 min'
		);
	});
});
