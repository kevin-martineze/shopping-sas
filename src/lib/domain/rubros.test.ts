import { describe, expect, it } from 'vitest';

import { RUBROS } from '$lib/domain/rubros';

describe('RUBROS', () => {
	it('ninguno pasa de tres ejes: es el techo que acepta la API', () => {
		for (const rubro of RUBROS) {
			expect(rubro.options.length).toBeLessThanOrEqual(3);
		}
	});

	it('ningún eje queda sin valores, que no dividiría nada', () => {
		for (const rubro of RUBROS) {
			for (const opcion of rubro.options) {
				expect(opcion.values.length).toBeGreaterThan(0);
			}
		}
	});

	it('los tonos van en el formato que valida la base', () => {
		const tonos = RUBROS.flatMap((rubro) =>
			rubro.options.flatMap((opcion) => opcion.values.flatMap((valor) => valor.hex ?? []))
		);

		expect(tonos.length).toBeGreaterThan(0);

		for (const tono of tonos) {
			expect(tono).toMatch(/^#[0-9a-fA-F]{6}$/);
		}
	});

	it('hay una salida para quien no se divide en nada', () => {
		const sinEjes = RUBROS.filter((rubro) => rubro.options.length === 0);

		expect(sinEjes).toHaveLength(1);
	});

	it('no repite nombres de eje dentro de un rubro', () => {
		for (const rubro of RUBROS) {
			const nombres = rubro.options.map((opcion) => opcion.name);

			expect(new Set(nombres).size).toBe(nombres.length);
		}
	});
});
