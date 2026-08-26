import { z } from 'zod';

/** Teléfono colombiano escrito como sea: se normaliza antes de guardarlo. */
const phone = z
	.string()
	.trim()
	.min(7, 'Escribe un número de contacto.')
	.max(20, 'Ese número es demasiado largo.')
	.regex(/^[0-9+ ()-]+$/, 'El número solo puede tener dígitos, espacios, +, ( ) o -.');

export const checkoutSchema = z.object({
	name: z.string().trim().min(2, 'Escribe tu nombre.').max(120, 'Ese nombre es demasiado largo.'),
	phone,
	city: z.string().trim().max(80).optional().default(''),
	address: z.string().trim().max(200).optional().default(''),
	notes: z.string().trim().max(500, 'Máximo 500 caracteres.').optional().default(''),
	shippingZoneId: z.string().uuid('Elige una zona de envío.'),
	couponCode: z.string().trim().max(40).optional().default('')
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const restockSchema = z.object({
	variantId: z.string().uuid(),
	contact: z
		.string()
		.trim()
		.min(7, 'Déjanos un WhatsApp o correo para avisarte.')
		.max(120, 'Ese contacto es demasiado largo.')
});
