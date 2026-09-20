import { z } from 'zod';

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export const paymentSchema = z
	.object({
		amountCop: z.coerce
			.number({ invalid_type_error: 'Escribe el monto.' })
			.int('El monto no lleva decimales.')
			.min(1, 'El monto debe ser mayor que cero.')
			.max(100_000_000, 'Ese monto parece un error.'),
		periodStart: z.string().regex(DATE_ONLY, 'Elige la fecha de inicio.'),
		periodEnd: z.string().regex(DATE_ONLY, 'Elige la fecha de fin.'),
		method: z.string().trim().min(2, 'Escribe el medio de pago.').max(40),
		reference: z.string().trim().max(120)
	})
	.refine((value) => value.periodEnd >= value.periodStart, {
		message: 'El período termina antes de empezar.',
		path: ['periodEnd']
	});

export const planChangeSchema = z.object({
	planCode: z.string().regex(/^[a-z0-9-]{2,40}$/, 'Elige un plan.'),
	notes: z.string().trim().max(500)
});

export const storeStatusSchema = z.enum(['active', 'suspended'], {
	errorMap: () => ({ message: 'Estado inválido.' })
});

export const storeFilterStatusSchema = z.enum(['trial', 'active', 'past_due', 'suspended']);
