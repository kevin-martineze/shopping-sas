/** Lo que una acción del panel le dice a la dueña: el texto y si salió bien. */
export interface ActionFeedback {
	kind: 'success' | 'error';
	text: string;
}

/** Texto útil: un string con algo más que espacios. Se devuelve recortado. */
function readText(value: unknown): string | null {
	if (typeof value !== 'string') return null;

	const text = value.trim();

	return text === '' ? null : text;
}

/**
 * Convierte lo que devuelve una form action (`page.form`) en un aviso.
 *
 * `error` gana sobre `message`. `{ ok: true }` sin texto dice «Cambios
 * guardados.». Cualquier otra cosa no avisa nada.
 */
export function actionFeedback(form: unknown): ActionFeedback | null {
	if (typeof form !== 'object' || form === null) return null;

	const error = 'error' in form ? readText(form.error) : null;

	if (error) return { kind: 'error', text: error };

	const message = 'message' in form ? readText(form.message) : null;

	if (message) return { kind: 'success', text: message };

	if ('ok' in form && form.ok === true) {
		return { kind: 'success', text: 'Cambios guardados.' };
	}

	return null;
}
