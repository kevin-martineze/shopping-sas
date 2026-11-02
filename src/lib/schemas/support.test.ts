import { describe, expect, it } from 'vitest';

import {
	parsePlatformSupportFilters,
	supportReplySchema,
	supportTicketSchema
} from '$lib/schemas/support';

const CASO_VALIDO = {
	subject: 'No me llega el correo de pago',
	category: 'PAYMENTS',
	body: 'Hice un pago de prueba y la cuenta no se refleja.'
};

describe('supportTicketSchema', () => {
	it('acepta un caso completo y recorta los espacios', () => {
		const ok = supportTicketSchema.safeParse({ ...CASO_VALIDO, subject: '  Pagos raros  ' });

		expect(ok.success).toBe(true);
		expect(ok.success && ok.data.subject).toBe('Pagos raros');
	});

	it('pide un asunto de al menos tres letras', () => {
		const parsed = supportTicketSchema.safeParse({ ...CASO_VALIDO, subject: 'ab' });

		expect(parsed.success).toBe(false);
		expect(!parsed.success && parsed.error.issues[0]?.message).toBe(
			'El asunto tiene que tener al menos 3 letras.'
		);
	});

	it('rechaza una categoría que no está en la lista', () => {
		expect(supportTicketSchema.safeParse({ ...CASO_VALIDO, category: 'OTRO' }).success).toBe(false);
	});

	it('pide una descripción de al menos diez letras', () => {
		expect(supportTicketSchema.safeParse({ ...CASO_VALIDO, body: 'no sirve' }).success).toBe(false);
	});
});

describe('supportReplySchema', () => {
	it('no acepta una respuesta vacía ni de solo espacios', () => {
		expect(supportReplySchema.safeParse({ body: '   ' }).success).toBe(false);
		expect(supportReplySchema.safeParse({ body: 'Gracias' }).success).toBe(true);
	});
});

describe('parsePlatformSupportFilters', () => {
	it('lee estado, búsqueda y página de la URL', () => {
		const filtros = parsePlatformSupportFilters(
			new URLSearchParams('estado=OPEN&q=pagos&pagina=3')
		);

		expect(filtros).toEqual({ status: 'OPEN', q: 'pagos', page: 3 });
	});

	it('ignora lo que no entiende en vez de romper la bandeja', () => {
		const filtros = parsePlatformSupportFilters(
			new URLSearchParams('estado=INVENTADO&pagina=-4&q=')
		);

		expect(filtros).toEqual({ status: null, q: null, page: 1 });
	});

	it('sin parámetros, muestra todo desde la primera página', () => {
		expect(parsePlatformSupportFilters(new URLSearchParams(''))).toEqual({
			status: null,
			q: null,
			page: 1
		});
	});
});
