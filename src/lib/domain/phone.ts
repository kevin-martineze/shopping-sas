/**
 * Indicativos de país para el WhatsApp de ventas.
 *
 * La lista es corta a propósito: Colombia primero, porque es el mercado, y
 * detrás los países desde los que alguien podría abrir una tienda. Una lista
 * de doscientos países obliga a buscar el propio entre ciento noventa que no
 * le sirven a nadie.
 */
export interface Country {
	/** ISO 3166-1 alfa-2. Es lo que viaja en el formulario. */
	code: string;
	name: string;
	/** Indicativo telefónico, sin `+`. */
	dial: string;
}

export const COUNTRIES: readonly Country[] = [
	{ code: 'CO', name: 'Colombia', dial: '57' },
	{ code: 'MX', name: 'México', dial: '52' },
	{ code: 'AR', name: 'Argentina', dial: '54' },
	{ code: 'CL', name: 'Chile', dial: '56' },
	{ code: 'PE', name: 'Perú', dial: '51' },
	{ code: 'EC', name: 'Ecuador', dial: '593' },
	{ code: 'VE', name: 'Venezuela', dial: '58' },
	{ code: 'PA', name: 'Panamá', dial: '507' },
	{ code: 'CR', name: 'Costa Rica', dial: '506' },
	{ code: 'GT', name: 'Guatemala', dial: '502' },
	{ code: 'DO', name: 'República Dominicana', dial: '1' },
	{ code: 'ES', name: 'España', dial: '34' },
	{ code: 'US', name: 'Estados Unidos', dial: '1' }
];

export const DEFAULT_COUNTRY = 'CO';

/** Solo dígitos: lo que el esquema espera y lo que la API guarda. */
function digits(value: string): string {
	return value.replace(/\D/g, '');
}

/**
 * El indicativo de un país.
 *
 * Un código que no está en la lista cae en el del país por defecto en vez de
 * quedar vacío: sin indicativo el número pasaría la validación de largo y se
 * guardaría inservible, que es peor que guardarlo con el indicativo más
 * probable.
 */
export function dialOf(code: string): string {
	const pais = COUNTRIES.find((candidato) => candidato.code === code);

	if (pais) return pais.dial;

	return COUNTRIES.find((candidato) => candidato.code === DEFAULT_COUNTRY)?.dial ?? '';
}

/** Une indicativo y número en lo que viaja a la API. */
export function joinPhone(code: string, number: string): string {
	const local = digits(number);

	if (!local) return '';

	return `${dialOf(code)}${local}`;
}

/**
 * Parte un número guardado en país y número local, para volver a pintarlo.
 *
 * Gana el indicativo más largo que encaje: con `1` (República Dominicana y
 * Estados Unidos) gana el primero de la lista, que para repintar un campo da
 * igual —el número completo es el mismo—.
 */
export function splitPhone(full: string): { code: string; number: string } {
	const todos = digits(full);

	if (!todos) return { code: DEFAULT_COUNTRY, number: '' };

	const candidatos = [...COUNTRIES].sort((uno, otro) => otro.dial.length - uno.dial.length);
	const pais = candidatos.find((candidato) => todos.startsWith(candidato.dial));

	if (!pais) return { code: DEFAULT_COUNTRY, number: todos };

	return { code: pais.code, number: todos.slice(pais.dial.length) };
}
