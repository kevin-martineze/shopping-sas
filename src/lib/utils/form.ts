import type { ZodError } from 'zod';

/**
 * Los errores de un formulario, uno por campo.
 *
 * La misma función corre en el servidor (al validar lo que llegó) y en el
 * navegador (al validar lo que se está escribiendo), así que un campo dice lo
 * mismo en los dos lados.
 *
 * Se queda con el primer problema de cada campo: mostrarle tres a la vez a
 * quien escribe su dirección no la ayuda a arreglar ninguno.
 */
export type FieldErrors = Record<string, string>;

export function fieldErrors(error: ZodError): FieldErrors {
	const errors: FieldErrors = {};

	for (const issue of error.issues) {
		const field = issue.path.at(0);

		if (typeof field === 'string' && !(field in errors)) {
			errors[field] = issue.message;
		}
	}

	return errors;
}
