import { describe, expect, it } from 'vitest';

import { dominioSchema, limpiarDominio } from '$lib/schemas/domain';

const rechaza = (raw: string, root = 'globerce.store') => {
	const result = dominioSchema(root).safeParse(raw);
	return result.success ? null : result.error.issues[0]?.message;
};

describe('limpiarDominio', () => {
	it('quita protocolo, ruta, espacios, mayúsculas y punto final', () => {
		expect(limpiarDominio('  https://www.Mitienda.com/ruta/?x=1 ')).toBe('www.mitienda.com');
		expect(limpiarDominio('mitienda.com.')).toBe('mitienda.com');
	});
});

describe('dominioSchema', () => {
	it('acepta un dominio propio y lo devuelve limpio', () => {
		const result = dominioSchema('globerce.store').safeParse('https://WWW.Mitienda.co/tienda');

		expect(result).toEqual({ success: true, data: 'www.mitienda.co' });
	});

	it('rechaza lo que no es un nombre de dominio', () => {
		expect(rechaza('')).toMatch(/Escribe el dominio/);
		expect(rechaza('mitienda')).toMatch(/extensión/);
		expect(rechaza('192.168.0.1')).toMatch(/dirección IP/);
		expect(rechaza('mi tienda.com')).toMatch(/no es válido/);
		expect(rechaza('a'.repeat(260) + '.com')).toMatch(/demasiado largo/);
	});

	it('rechaza localhost y vercel.app', () => {
		expect(rechaza('localhost')).toMatch(/no se puede usar/);
		expect(rechaza('app.vercel.app')).toMatch(/no se puede usar/);
	});

	it('rechaza el dominio raíz y sus subdominios', () => {
		expect(rechaza('globerce.store')).toMatch(/es de Globerce/);
		expect(rechaza('www.globerce.store')).toMatch(/es de Globerce/);
		expect(rechaza('mitienda.com', 'globerce.store')).toBeNull();
	});

	it('sin dominio raíz solo valida el formato', () => {
		expect(dominioSchema(undefined).safeParse('globerce.store').success).toBe(true);
	});
});
