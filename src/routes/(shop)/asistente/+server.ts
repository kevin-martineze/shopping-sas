import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';
import { askAssistant } from '$lib/server/api/assistant';
import { publicContext } from '$lib/server/context';

/**
 * El chat de la tienda, desde el navegador.
 *
 * Es un endpoint nuestro y no una form action porque un chat va y viene sin
 * recargar nada: no hay formulario que enviar ni página que actualizar. El
 * navegador sigue sin hablar con la API —habla con este servidor, que es quien
 * tiene el secreto compartido y la IP de quien pregunta—, que es lo que
 * importa de la regla.
 *
 * Lo que responde la API ya viene listo para mostrar. Si falla, se dice con
 * una frase y se ofrece WhatsApp: un chat que se queda mudo es peor que uno
 * que no existe.
 */
const MAX_TURNOS = 12;
const MAX_LARGO = 500;

export const POST: RequestHandler = async (event) => {
	const cuerpo: unknown = await event.request.json().catch(() => null);
	const messages = leerTurnos(cuerpo);

	if (messages.length === 0) {
		return json({ reply: '¿En qué te ayudo?', handoff: false });
	}

	const result = await askAssistant(publicContext(event), messages);

	if (!result.ok) {
		return json({ reply: excusa(result.code), handoff: true });
	}

	return json(result.data);
};

function leerTurnos(cuerpo: unknown): { role: 'user' | 'assistant'; content: string }[] {
	if (typeof cuerpo !== 'object' || cuerpo === null) return [];

	const lista = (cuerpo as { messages?: unknown }).messages;

	if (!Array.isArray(lista)) return [];

	return lista
		.filter(
			(turno): turno is { role: 'user' | 'assistant'; content: string } =>
				typeof turno === 'object' &&
				turno !== null &&
				(turno as { role?: unknown }).role !== undefined &&
				typeof (turno as { content?: unknown }).content === 'string'
		)
		.map((turno) => ({
			role: turno.role === 'assistant' ? ('assistant' as const) : ('user' as const),
			content: turno.content.slice(0, MAX_LARGO)
		}))
		.slice(-MAX_TURNOS);
}

/** Qué se dice cuando no hay respuesta. Nunca el error técnico. */
function excusa(code: string): string {
	if (code === 'plan_limit') {
		return 'Por hoy no puedo seguir respondiendo por acá. Escríbenos por WhatsApp y te atendemos.';
	}

	return 'No pude responder eso. Escríbenos por WhatsApp y te ayuda alguien del equipo.';
}
