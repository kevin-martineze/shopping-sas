import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { fieldErrors } from '$lib/utils/form';

const schema = z.object({
	nombre: z.string().min(2, 'Escribe el nombre.').max(4, 'Muy largo.'),
	correo: z.string().email('Correo inválido.')
});

function errorsOf(value: unknown) {
	const result = schema.safeParse(value);

	return result.success ? {} : fieldErrors(result.error);
}

describe('fieldErrors', () => {
	it('junta un mensaje por campo', () => {
		expect(errorsOf({ nombre: '', correo: 'no-es-correo' })).toEqual({
			nombre: 'Escribe el nombre.',
			correo: 'Correo inválido.'
		});
	});

	it('se queda con el primero de cada campo', () => {
		expect(errorsOf({ nombre: 12, correo: 'ana@tienda.com' }).nombre).toBeDefined();
		expect(Object.keys(errorsOf({ nombre: '', correo: '' }))).toEqual(['nombre', 'correo']);
	});

	it('sin errores, no hay nada que pintar', () => {
		expect(errorsOf({ nombre: 'Ana', correo: 'ana@tienda.com' })).toEqual({});
	});
});
