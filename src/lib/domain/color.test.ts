import { describe, expect, it } from 'vitest';

import { hexToHsv, hsvToHex } from '$lib/domain/color';

describe('hexToHsv y hsvToHex', () => {
	it('los primarios caen donde se espera', () => {
		expect(hexToHsv('#FF0000')).toEqual({ h: 0, s: 1, v: 1 });
		expect(hexToHsv('#00FF00')).toEqual({ h: 120, s: 1, v: 1 });
		expect(hexToHsv('#0000FF')).toEqual({ h: 240, s: 1, v: 1 });
		expect(hexToHsv('#000000')).toEqual({ h: 0, s: 0, v: 0 });
	});

	it('ida y vuelta devuelve el mismo color', () => {
		for (const hex of ['#1E6F6B', '#E0A458', '#1E3A8A', '#FFFFFF', '#777777', '#BE185D']) {
			expect(hsvToHex(hexToHsv(hex))).toBe(hex);
		}
	});

	it('se sale de rango sin romperse', () => {
		expect(hsvToHex({ h: 480, s: 2, v: -1 })).toBe('#000000');
		expect(hsvToHex({ h: -120, s: 1, v: 1 })).toBe('#0000FF');
	});
});
