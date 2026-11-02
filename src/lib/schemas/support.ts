import { z } from 'zod';

import { SUPPORT_CATEGORIES, SUPPORT_STATUSES, type SupportStatus } from '$lib/domain/support';

/** Lo que la dueña escribe para abrir un caso. El servidor vuelve a validarlo: esto es la primera vez, no la última. */
export const supportTicketSchema = z.object({
	subject: z
		.string()
		.trim()
		.min(3, 'El asunto tiene que tener al menos 3 letras.')
		.max(160, 'El asunto no puede tener más de 160 caracteres.'),
	category: z.enum(SUPPORT_CATEGORIES, {
		errorMap: () => ({ message: 'Elige un motivo de la lista.' })
	}),
	body: z
		.string()
		.trim()
		.min(10, 'Cuéntanos un poco más, con al menos 10 letras.')
		.max(5000, 'El mensaje no puede tener más de 5000 caracteres.')
});

export const supportReplySchema = z.object({
	body: z
		.string()
		.trim()
		.min(1, 'Escribe tu mensaje.')
		.max(5000, 'El mensaje no puede tener más de 5000 caracteres.')
});

export const supportStatusSchema = z.enum(SUPPORT_STATUSES, {
	errorMap: () => ({ message: 'Ese estado no existe.' })
});

/** Filtros de la bandeja del equipo. Viven en la URL: `?estado=OPEN&q=…&pagina=2`. */
export interface PlatformSupportFilters {
	status: SupportStatus | null;
	q: string | null;
	page: number;
}

const filtersSchema = z.object({
	estado: z.enum(SUPPORT_STATUSES).optional().catch(undefined),
	q: z.string().trim().max(100).optional().catch(undefined),
	pagina: z.coerce.number().int().min(1).catch(1)
});

/** Lee los filtros de la URL. Lo que no entiende, lo ignora en vez de romper la bandeja. */
export function parsePlatformSupportFilters(params: URLSearchParams): PlatformSupportFilters {
	const parsed = filtersSchema.safeParse(Object.fromEntries(params));

	if (!parsed.success) return { status: null, q: null, page: 1 };

	return {
		status: parsed.data.estado ?? null,
		q: parsed.data.q || null,
		page: parsed.data.pagina
	};
}
