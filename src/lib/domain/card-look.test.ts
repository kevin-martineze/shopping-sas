import { describe, expect, it } from 'vitest';

import { cardLookOf } from '$lib/domain/card-look';
import { templateOf } from '$lib/domain/templates';

describe('cardLookOf', () => {
	it('la tarjeta retail muestra hasta cinco muestras de color', () => {
		expect(cardLookOf(templateOf('moda')).swatchLimit).toBe(5);
	});

	it('las demás tarjetas muestran todas sus muestras', () => {
		expect(cardLookOf(templateOf('editorial')).swatchLimit).toBeNull();
		expect(cardLookOf(templateOf('atelier')).swatchLimit).toBeNull();
	});
});
