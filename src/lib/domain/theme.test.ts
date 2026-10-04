import { describe, expect, it } from 'vitest';

import { hsvToHex } from '$lib/domain/color';
import { TEMPLATES } from '$lib/domain/templates';
import {
	accentFits,
	BRAND_COLORS,
	contrastRatio,
	EMPTY_THEME,
	heroOf,
	isEmptyTheme,
	MIN_ACCENT_CONTRAST,
	readableEdge,
	readableOn,
	readTheme,
	themeStyle
} from '$lib/domain/theme';

describe('contrastRatio', () => {
	it('negro sobre blanco es el máximo y un color contra sí mismo el mínimo', () => {
		expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
		expect(contrastRatio('#1D4ED8', '#1D4ED8')).toBe(1);
	});

	it('no depende del orden', () => {
		expect(contrastRatio('#FFFFFF', '#1D4ED8')).toBe(contrastRatio('#1D4ED8', '#FFFFFF'));
	});
});

describe('readableOn', () => {
	it('blanco sobre oscuros y negro sobre claros', () => {
		expect(readableOn('#1E3A8A')).toBe('#FFFFFF');
		expect(readableOn('#FFE66D')).toBe('#000000');
	});

	it('el texto de un botón siempre pasa AA, sea cual sea el color', () => {
		for (const hex of [
			'#777777',
			'#E0A458',
			'#F97316',
			'#14B8A6',
			...BRAND_COLORS.map((c) => c.hex)
		]) {
			expect(contrastRatio(hex, readableOn(hex))).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
		}
	});
});

describe('accentFits', () => {
	it('un azul oscuro se lee sobre Editorial y no sobre Noche', () => {
		expect(accentFits('editorial', '#1E3A8A')).toBe(true);
		expect(accentFits('noche', '#1E3A8A')).toBe(false);
	});

	it('un amarillo claro no se lee sobre fondo blanco', () => {
		expect(accentFits('editorial', '#FFE66D')).toBe(false);
	});

	it('toda plantilla tiene varios colores sugeridos que se leen', () => {
		for (const template of TEMPLATES) {
			const fitting = BRAND_COLORS.filter((color) => accentFits(template.code, color.hex));

			expect(fitting.length, template.code).toBeGreaterThanOrEqual(4);
		}
	});
});

describe('readableEdge', () => {
	it('sobre blanco, un gris se lee hasta más o menos la mitad del brillo', () => {
		const edge = readableEdge('#FFFFFF', 0, 0);

		expect(edge).toBeGreaterThan(0.4);
		expect(edge).toBeLessThan(0.5);
	});

	it('el borde separa los que se leen de los que no, sobre fondo claro y oscuro', () => {
		for (const background of ['#FFFFFF', '#0F0F10']) {
			const edge = readableEdge(background, 215, 0.8);
			const dark = hsvToHex({ h: 215, s: 0.8, v: Math.max(0, edge - 0.05) });
			const light = hsvToHex({ h: 215, s: 0.8, v: Math.min(1, edge + 0.05) });
			const [readable, unreadable] = background === '#FFFFFF' ? [dark, light] : [light, dark];

			expect(contrastRatio(background, readable)).toBeGreaterThanOrEqual(MIN_ACCENT_CONTRAST);
			expect(contrastRatio(background, unreadable)).toBeLessThan(MIN_ACCENT_CONTRAST);
		}
	});
});

describe('themeStyle', () => {
	it('sin ajustes no pisa nada', () => {
		expect(themeStyle('editorial', EMPTY_THEME)).toBe('');
	});

	it('pisa color, texto encima, letras y esquinas', () => {
		const style = themeStyle('editorial', {
			accent: '#1D4ED8',
			fonts: 'tight',
			corners: 'square',
			hero: null
		});

		expect(style).toContain('--primary: #1D4ED8');
		expect(style).toContain('--primary-foreground: #FFFFFF');
		expect(style).toContain('--ring: #1D4ED8');
		expect(style).toContain("--font-title: 'Inter Tight Variable'");
		expect(style).toContain('--radius: 0rem');
	});

	it('un color que no se lee en esta plantilla se ignora, lo demás no', () => {
		const style = themeStyle('noche', { ...EMPTY_THEME, accent: '#1E3A8A', corners: 'round' });

		expect(style).not.toContain('--primary');
		expect(style).toContain('--radius: 1.25rem');
	});
});

describe('heroOf', () => {
	it('manda la portada elegida y, si no hay, la de la plantilla', () => {
		expect(heroOf('editorial', EMPTY_THEME)).toBe('cover');
		expect(heroOf('editorial', { ...EMPTY_THEME, hero: 'split' })).toBe('split');
	});
});

describe('readTheme', () => {
	it('descarta lo que no reconoce y normaliza el color', () => {
		expect(
			readTheme({ accent: '#1d4ed8', fonts: 'comic', corners: 'soft', hero: 'carrusel' })
		).toEqual({ accent: '#1D4ED8', fonts: null, corners: 'soft', hero: null });
		expect(readTheme({ accent: 'azul' }).accent).toBeNull();
	});

	it('isEmptyTheme solo es cierto sin ningún ajuste', () => {
		expect(isEmptyTheme(EMPTY_THEME)).toBe(true);
		expect(isEmptyTheme({ ...EMPTY_THEME, fonts: 'serif' })).toBe(false);
	});
});
