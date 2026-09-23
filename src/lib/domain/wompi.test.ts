import { describe, expect, it } from 'vitest';

import { completeWompiKeys, mixedModes, parseWompiKeys, wompiMode } from '$lib/domain/wompi';

const PEGADO_ETIQUETADO = `
Llave pública: pub_test_a1b2c3d4e5f6g7h8
Llave privada: prv_test_z9y8x7w6v5u4t3s2
Secreto de integridad: test_integrity_1234567890abcdef
Secreto de eventos: test_events_abcdef1234567890
`;

const PEGADO_SIN_ETIQUETAS = `pub_prod_abcdefghij123456
prv_prod_123456abcdefghij
prod_integrity_qwertyuiop1234
prod_events_asdfghjkl56789`;

describe('parseWompiKeys', () => {
	it('reconoce las cuatro llaves de un bloque pegado con etiquetas', () => {
		expect(parseWompiKeys(PEGADO_ETIQUETADO)).toEqual({
			publicKey: 'pub_test_a1b2c3d4e5f6g7h8',
			privateKey: 'prv_test_z9y8x7w6v5u4t3s2',
			integritySecret: 'test_integrity_1234567890abcdef',
			eventsSecret: 'test_events_abcdef1234567890'
		});
	});

	it('reconoce las cuatro sin etiquetas, en el orden que sea', () => {
		expect(parseWompiKeys(PEGADO_SIN_ETIQUETAS)).toEqual({
			publicKey: 'pub_prod_abcdefghij123456',
			privateKey: 'prv_prod_123456abcdefghij',
			integritySecret: 'prod_integrity_qwertyuiop1234',
			eventsSecret: 'prod_events_asdfghjkl56789'
		});
	});

	it('deja sin poner lo que no aparece', () => {
		expect(parseWompiKeys('pub_test_a1b2c3d4e5f6g7h8')).toEqual({
			publicKey: 'pub_test_a1b2c3d4e5f6g7h8'
		});
		expect(parseWompiKeys('esto no tiene ninguna llave')).toEqual({});
	});

	it('con dos llaves del mismo tipo, gana la primera', () => {
		const dosVeces = 'pub_test_primeraaaaaaaaa pub_test_segundaaaaaaaa';
		expect(parseWompiKeys(dosVeces).publicKey).toBe('pub_test_primeraaaaaaaaa');
	});
});

describe('completeWompiKeys', () => {
	it('arma el juego completo cuando están las cuatro', () => {
		expect(completeWompiKeys(parseWompiKeys(PEGADO_ETIQUETADO))).toEqual({
			publicKey: 'pub_test_a1b2c3d4e5f6g7h8',
			privateKey: 'prv_test_z9y8x7w6v5u4t3s2',
			integritySecret: 'test_integrity_1234567890abcdef',
			eventsSecret: 'test_events_abcdef1234567890'
		});
	});

	it('null si falta cualquiera', () => {
		expect(completeWompiKeys({ publicKey: 'pub_test_a1b2c3d4e5f6g7h8' })).toBeNull();
		expect(completeWompiKeys({})).toBeNull();
	});
});

describe('wompiMode', () => {
	it('reconoce pruebas y producción por el prefijo', () => {
		expect(wompiMode('pub_test_a1b2c3d4e5f6g7h8')).toBe('test');
		expect(wompiMode('prv_test_a1b2c3d4e5f6g7h8')).toBe('test');
		expect(wompiMode('test_integrity_1234567890abcdef')).toBe('test');
		expect(wompiMode('pub_prod_a1b2c3d4e5f6g7h8')).toBe('prod');
		expect(wompiMode('prod_events_1234567890abcdef')).toBe('prod');
	});

	it('null si no hay llave o no se reconoce', () => {
		expect(wompiMode(undefined)).toBeNull();
		expect(wompiMode('algo-que-no-es-una-llave')).toBeNull();
	});
});

describe('mixedModes', () => {
	it('false cuando todas las llaves son del mismo mundo', () => {
		expect(mixedModes(parseWompiKeys(PEGADO_ETIQUETADO))).toBe(false);
		expect(mixedModes(parseWompiKeys(PEGADO_SIN_ETIQUETAS))).toBe(false);
	});

	it('true cuando se mezclan pruebas con producción', () => {
		const mezclado = `pub_test_a1b2c3d4e5f6g7h8
prv_prod_z9y8x7w6v5u4t3s2
test_integrity_1234567890abcdef
test_events_abcdef1234567890`;
		expect(mixedModes(parseWompiKeys(mezclado))).toBe(true);
	});

	it('false si solo hay una llave, aunque sea de un mundo', () => {
		expect(mixedModes({ publicKey: 'pub_test_a1b2c3d4e5f6g7h8' })).toBe(false);
	});
});
