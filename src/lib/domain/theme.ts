import type { HeroLayout, StorefrontTemplate } from '$lib/domain/templates';

import { hsvToHex } from '$lib/domain/color';
import { HERO_LAYOUTS, templateOf } from '$lib/domain/templates';

/**
 * Lo que una tienda le ajusta a su plantilla sin cambiar de plantilla.
 *
 * La plantilla es el vestido; esto es el dobladillo: el color de la marca, la
 * pareja de letras, las esquinas y cómo se arma la portada. Cada ajuste es
 * opcional y `null` significa «lo que diga la plantilla», así que cambiar de
 * plantilla nunca deja la tienda a medio vestir.
 *
 * Son listas cerradas a propósito. Una fuente arbitraria o un radio de 40 px
 * no se pueden garantizar legibles; tres parejas de letras y tres esquinas sí.
 * El color es el único valor libre, y por eso se mide: tiene que leerse sobre
 * el fondo de la plantilla (ver `accentFits`).
 *
 * La API guarda los códigos tal cual (ver `shared/content/theme.ts` allá); qué
 * significan se decide aquí, en `themeStyle`.
 */
export const THEME_FONTS = ['serif', 'sans', 'tight'] as const;
export const THEME_CORNERS = ['square', 'soft', 'round'] as const;

export type ThemeFont = (typeof THEME_FONTS)[number];
export type ThemeCorners = (typeof THEME_CORNERS)[number];

export interface StoreTheme {
	/** Color de la marca en `#RRGGBB`: botones, enlaces y lo que se pulsa. */
	accent: string | null;
	fonts: ThemeFont | null;
	corners: ThemeCorners | null;
	hero: HeroLayout | null;
}

export const EMPTY_THEME: StoreTheme = { accent: null, fonts: null, corners: null, hero: null };

export const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;

/**
 * El contraste mínimo del color de marca contra el fondo. Es el de WCAG AA para
 * texto normal: el color de la marca también pinta enlaces y precios, no solo
 * botones grandes.
 */
export const MIN_ACCENT_CONTRAST = 4.5;

const FONT_STACKS = {
	serif: "'Fraunces Variable', ui-serif, Georgia, serif",
	sans: "'Hanken Grotesk Variable', ui-sans-serif, system-ui, sans-serif",
	tight: "'Inter Tight Variable', ui-sans-serif, system-ui, sans-serif"
} as const;

export interface FontOption {
	code: ThemeFont;
	name: string;
	hint: string;
	title: string;
	body: string;
}

export const FONT_OPTIONS: FontOption[] = [
	{
		code: 'serif',
		name: 'Clásica',
		hint: 'Títulos con serifa, texto limpio',
		title: FONT_STACKS.serif,
		body: FONT_STACKS.sans
	},
	{
		code: 'sans',
		name: 'Moderna',
		hint: 'Una sola letra, redonda y clara',
		title: FONT_STACKS.sans,
		body: FONT_STACKS.sans
	},
	{
		code: 'tight',
		name: 'Compacta',
		hint: 'Letra cerrada, de cartel',
		title: FONT_STACKS.tight,
		body: FONT_STACKS.tight
	}
];

export interface CornerOption {
	code: ThemeCorners;
	name: string;
	radius: string;
}

export const CORNER_OPTIONS: CornerOption[] = [
	{ code: 'square', name: 'Rectas', radius: '0rem' },
	{ code: 'soft', name: 'Suaves', radius: '0.625rem' },
	{ code: 'round', name: 'Redondas', radius: '1.25rem' }
];

export interface HeroOption {
	code: HeroLayout;
	name: string;
	hint: string;
}

export const HERO_OPTIONS: HeroOption[] = [
	{ code: 'cover', name: 'Foto completa', hint: 'La foto a todo lo ancho y el texto encima' },
	{ code: 'split', name: 'Partida', hint: 'El texto a un lado y la foto al otro' },
	{ code: 'typographic', name: 'Solo título', hint: 'Sin foto grande: manda el titular' },
	{ code: 'centered', name: 'Centrada', hint: 'Todo al centro y la foto enmarcada' },
	{ code: 'block', name: 'Bloque de color', hint: 'Un bloque con tu color y la foto al lado' }
];

/**
 * Colores para empezar. Hay claros y oscuros para que cada plantilla tenga de
 * dónde escoger: sobre fondo blanco solo se leen los oscuros, y sobre Noche
 * solo los claros. El selector enseña los que sirven para la plantilla actual.
 */
export const BRAND_COLORS: { hex: string; name: string }[] = [
	{ hex: '#141414', name: 'Carbón' },
	{ hex: '#1E3A8A', name: 'Azul noche' },
	{ hex: '#1D4ED8', name: 'Azul' },
	{ hex: '#0F766E', name: 'Verde azulado' },
	{ hex: '#15803D', name: 'Verde' },
	{ hex: '#9A3412', name: 'Terracota' },
	{ hex: '#B91C1C', name: 'Rojo' },
	{ hex: '#BE185D', name: 'Fucsia' },
	{ hex: '#7E22CE', name: 'Morado' },
	{ hex: '#6B5641', name: 'Café' },
	{ hex: '#F3EFE6', name: 'Marfil' },
	{ hex: '#E0A458', name: 'Ámbar' },
	{ hex: '#FCA5A5', name: 'Coral' },
	{ hex: '#86EFAC', name: 'Menta' },
	{ hex: '#93C5FD', name: 'Celeste' },
	{ hex: '#D8B4FE', name: 'Lila' }
];

/**
 * Texto sobre el color de marca: el que más contraste, blanco o negro. Negro
 * puro y no casi negro a propósito: con estos dos, el peor color posible (un
 * gris medio) todavía da 4,58:1, así que cualquier botón pasa AA. Con un casi
 * negro hay tonos que se quedan cortos.
 */
const ON_LIGHT = '#000000';
const ON_DARK = '#FFFFFF';

function channel(value: number): number {
	const srgb = value / 255;

	return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa de WCAG para un `#RRGGBB`. */
export function luminance(hex: string): number {
	const red = channel(Number.parseInt(hex.slice(1, 3), 16));
	const green = channel(Number.parseInt(hex.slice(3, 5), 16));
	const blue = channel(Number.parseInt(hex.slice(5, 7), 16));

	return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

/** Contraste de WCAG entre dos colores, de 1 a 21. */
export function contrastRatio(first: string, second: string): number {
	const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);

	return (light + 0.05) / (dark + 0.05);
}

/** Con qué color se escribe encima del color de marca. Siempre pasa AA (4,5:1). */
export function readableOn(hex: string): string {
	return contrastRatio(hex, ON_DARK) >= contrastRatio(hex, ON_LIGHT) ? ON_DARK : ON_LIGHT;
}

/**
 * Para un tono y una saturación, el brillo (`v`, de 0 a 1) en que el color
 * deja de leerse sobre `background`. Sobre un fondo claro se leen los que
 * quedan por debajo; sobre uno oscuro, los de encima. Es lo que dibuja el
 * borde de la zona apagada en el selector de color.
 *
 * Funciona porque, con tono y saturación fijos, más brillo es siempre más
 * luminancia: basta una búsqueda binaria.
 */
export function readableEdge(background: string, hue: number, saturation: number): number {
	const darkBackground = luminance(background) < 0.5;
	const fits = (v: number) =>
		contrastRatio(background, hsvToHex({ h: hue, s: saturation, v })) >= MIN_ACCENT_CONTRAST;

	let low = 0;
	let high = 1;

	for (let step = 0; step < 16; step++) {
		const middle = (low + high) / 2;

		if (fits(middle) !== darkBackground) low = middle;
		else high = middle;
	}

	return (low + high) / 2;
}

/** Si el color de marca se lee sobre el fondo de esta plantilla. */
export function accentFits(template: StorefrontTemplate, accent: string): boolean {
	return contrastRatio(templateOf(template).background, accent) >= MIN_ACCENT_CONTRAST;
}

/**
 * Por qué un color escrito a mano no sirve para esta plantilla, en palabras de
 * quien vende; null si sirve. Vacío es «el de la plantilla», que siempre sirve.
 */
export function accentProblem(template: StorefrontTemplate, accent: string): string | null {
	if (accent === '') return null;

	if (!HEX_COLOR.test(accent)) return 'Escribe el color así: # y seis letras o números.';

	if (!accentFits(template, accent.toUpperCase())) {
		return `Ese color no se lee bien sobre el fondo de ${templateOf(template).name}. Prueba con uno más oscuro (o más claro, si la plantilla es oscura).`;
	}

	return null;
}

/** La portada que se ve: la que eligió la dueña o, si no, la de la plantilla. */
export function heroOf(template: StorefrontTemplate, theme: StoreTheme): HeroLayout {
	return theme.hero ?? templateOf(template).hero;
}

/**
 * Las variables CSS que el ajuste pisa sobre la plantilla, listas para un
 * `style=`. Van en el mismo elemento que `data-storefront-template`, así que
 * ganan a `app.css` sin pelear especificidad.
 *
 * Un color que no se lee sobre esta plantilla se ignora en vez de pintarse:
 * pasa cuando la dueña cambia de una plantilla clara a Noche con un azul
 * oscuro guardado. La tienda sigue legible y el panel le avisa.
 */
export function themeStyle(template: StorefrontTemplate, theme: StoreTheme): string {
	const vars: string[] = [];

	if (theme.accent && accentFits(template, theme.accent)) {
		vars.push(
			`--primary: ${theme.accent}`,
			`--primary-foreground: ${readableOn(theme.accent)}`,
			`--ring: ${theme.accent}`
		);
	}

	const fonts = FONT_OPTIONS.find((option) => option.code === theme.fonts);

	if (fonts) vars.push(`--font-title: ${fonts.title}`, `--font-body: ${fonts.body}`);

	const corners = CORNER_OPTIONS.find((option) => option.code === theme.corners);

	if (corners) vars.push(`--radius: ${corners.radius}`);

	return vars.join('; ');
}

function oneOf<T extends string>(list: readonly T[], value: unknown): T | null {
	return list.find((item) => item === value) ?? null;
}

/**
 * Lee unos ajustes de donde vengan —la API o la URL de la vista previa— sin
 * fiarse: lo que no se reconozca vuelve a ser el de la plantilla.
 */
export function readTheme(input: {
	accent?: unknown;
	fonts?: unknown;
	corners?: unknown;
	hero?: unknown;
}): StoreTheme {
	const accent = typeof input.accent === 'string' ? input.accent : '';

	return {
		accent: HEX_COLOR.test(accent) ? accent.toUpperCase() : null,
		fonts: oneOf(THEME_FONTS, input.fonts),
		corners: oneOf(THEME_CORNERS, input.corners),
		hero: oneOf(HERO_LAYOUTS, input.hero)
	};
}

/** Igual que `readTheme`, para un valor del que no se sabe ni la forma. */
export function readUnknownTheme(value: unknown): StoreTheme {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) return EMPTY_THEME;

	const fields = new Map(Object.entries(value));

	return readTheme({
		accent: fields.get('accent'),
		fonts: fields.get('fonts'),
		corners: fields.get('corners'),
		hero: fields.get('hero')
	});
}

export function isEmptyTheme(theme: StoreTheme): boolean {
	return Object.values(theme).every((value) => value === null);
}
