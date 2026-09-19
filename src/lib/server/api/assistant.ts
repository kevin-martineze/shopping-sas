import type { ApiResult } from '$lib/server/api/client';
import type { PublicContext } from '$lib/server/context';

import { z } from 'zod';

import { publicRequest } from '$lib/server/api/request';

/** El asistente de la tienda. Ver `ecommerce-api/src/modules/assistant`. */

export interface AssistantReply {
	reply: string;
	/** Si conviene seguir por WhatsApp: el asistente no supo, o él mismo lo sugirió. */
	handoff: boolean;
}

const replySchema = z
	.object({ reply: z.string(), handoff: z.boolean(), remaining: z.number() })
	.transform((body): AssistantReply => ({ reply: body.reply, handoff: body.handoff }));

export interface AssistantTurn {
	role: 'user' | 'assistant';
	content: string;
}

/**
 * Pregunta por la tienda del contexto.
 *
 * La conversación viaja entera en cada pregunta: no se guarda en ningún lado
 * —ni acá ni en la API— porque es de quien está preguntando. Lo que queda es
 * el historial en su propio navegador, que desaparece cuando cierra.
 */
export function askAssistant(
	ctx: PublicContext,
	messages: AssistantTurn[]
): Promise<ApiResult<AssistantReply>> {
	return publicRequest(ctx, '/assistant', replySchema, { method: 'POST', body: { messages } });
}
