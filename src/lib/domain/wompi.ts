/**
 * Las llaves de Wompi, leídas de lo que la dueña pegue.
 *
 * Wompi no tiene «conectar con un clic»: no hay una redirección que vuelva
 * con la cuenta ya enlazada, así que las llaves se copian del panel de
 * comercios. Lo que sí se puede es no hacérselo escribir cuatro veces: las
 * cuatro llaves llevan prefijos distintos, así que de un bloque pegado de
 * cualquier manera —con etiquetas, en cualquier orden, con saltos de línea o
 * sin ellos— se saca cuál es cuál.
 *
 * Vive en `domain` y no en el componente porque lo usan los dos lados: el
 * panel para ir mostrando lo que reconoció mientras se pega, y la form action
 * para aceptar el mismo pegado de quien no tenga JavaScript.
 */
export interface WompiKeys {
	publicKey: string;
	privateKey: string;
	integritySecret: string;
	eventsSecret: string;
}

/** Lo que se reconoció de un pegado: puede faltar alguna. */
export type PartialWompiKeys = Partial<WompiKeys>;

/** Las cuatro llaves, cada una con la forma que le da Wompi. */
const PATTERNS: { field: keyof WompiKeys; pattern: RegExp }[] = [
	{ field: 'publicKey', pattern: /pub_(?:test|prod)_[A-Za-z0-9]{8,}/ },
	{ field: 'privateKey', pattern: /prv_(?:test|prod)_[A-Za-z0-9]{8,}/ },
	{ field: 'integritySecret', pattern: /(?:test|prod)_integrity_[A-Za-z0-9]{8,}/ },
	{ field: 'eventsSecret', pattern: /(?:test|prod)_events_[A-Za-z0-9]{8,}/ }
];

/** En qué mundo vive una llave: el de pruebas o el de verdad. */
export type WompiMode = 'test' | 'prod';

export const WOMPI_MODE_LABEL: Record<WompiMode, string> = {
	test: 'de pruebas',
	prod: 'de producción'
};

export function wompiMode(key: string | undefined): WompiMode | null {
	if (!key) return null;
	if (/(?:^pub_|^prv_)test_|^test_/.test(key)) return 'test';
	if (/(?:^pub_|^prv_)prod_|^prod_/.test(key)) return 'prod';

	return null;
}

/**
 * Saca las llaves de un texto pegado. Las que no aparezcan, no salen.
 *
 * El orden y las etiquetas dan igual: cada llave se busca por su prefijo, que
 * es único. Si el texto trae dos llaves del mismo tipo —porque se pegó dos
 * veces— manda la primera: reemplazar por la última haría que un pegado
 * duplicado cambiara en silencio lo que se guarda.
 */
export function parseWompiKeys(text: string): PartialWompiKeys {
	const keys: PartialWompiKeys = {};

	for (const { field, pattern } of PATTERNS) {
		const match = text.match(pattern);

		if (match) keys[field] = match[0];
	}

	return keys;
}

/** Las cuatro, o null si falta alguna. */
export function completeWompiKeys(keys: PartialWompiKeys): WompiKeys | null {
	const { publicKey, privateKey, integritySecret, eventsSecret } = keys;

	if (!publicKey || !privateKey || !integritySecret || !eventsSecret) return null;

	return { publicKey, privateKey, integritySecret, eventsSecret };
}

/**
 * Si las llaves pegadas son todas del mismo mundo.
 *
 * Mezclar pruebas con producción es el error que más cuesta encontrar: el
 * enlace de pago se arma, la clienta paga de verdad y el aviso nunca cuadra
 * porque se firma con el secreto del otro mundo.
 */
export function mixedModes(keys: PartialWompiKeys): boolean {
	const modes = new Set(Object.values(keys).map(wompiMode).filter(Boolean));

	return modes.size > 1;
}
