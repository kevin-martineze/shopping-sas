import { z } from 'zod';

import type { WompiWidget } from '$lib/domain/wompi';

/**
 * El widget embebido de Wompi, tal como lo manda la API.
 *
 * Vive aparte para que el cobro de un pedido y el del plan lean la misma forma:
 * si la API cambia un campo, se ajusta aquí y nada más.
 */
export const widgetSchema = z
	.object({
		publicKey: z.string(),
		currency: z.literal('COP'),
		amountInCents: z.number(),
		reference: z.string(),
		integritySignature: z.string(),
		redirectUrl: z.string(),
		customerEmail: z.string().nullish()
	})
	.transform((widget): WompiWidget => ({
		public_key: widget.publicKey,
		currency: widget.currency,
		amount_in_cents: widget.amountInCents,
		reference: widget.reference,
		integrity_signature: widget.integritySignature,
		redirect_url: widget.redirectUrl,
		customer_email: widget.customerEmail ?? null
	}));
