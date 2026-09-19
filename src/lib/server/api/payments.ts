import type { ApiResult } from '$lib/server/api/client';

import { z } from 'zod';

import { apiRequest } from '$lib/server/api/client';

/**
 * El aviso de que un pago se aprobó.
 *
 * Con Wompi lo manda Wompi directamente a la API, firmado, y este archivo no
 * interviene. Esto existe solo para la pasarela simulada, donde quien hace de
 * pasarela es nuestra propia página de prueba.
 */
export function approveSimulatedPayment(
	reference: string,
	amountCop: number,
	clientIp: string | null
): Promise<ApiResult<{ received: boolean }>> {
	return apiRequest('/payments/events', z.object({ received: z.boolean() }), {
		method: 'POST',
		body: { reference, amountCop },
		clientIp
	});
}
