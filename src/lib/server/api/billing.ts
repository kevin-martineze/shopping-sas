import type { ApiResult } from '$lib/server/api/client';

import { z } from 'zod';

import { apiRequest } from '$lib/server/api/client';

/**
 * Lo que el navegador necesita para guardar una tarjeta.
 *
 * Sin sesión y sin tienda, como los planes: se pide mientras se está creando
 * la tienda, cuando todavía no hay ninguna. Lo que devuelve es público por
 * definición —la llave pública de la pasarela y sus términos—, y con eso el
 * navegador convierte la tarjeta en un token. El número no pasa por acá.
 */
export interface BillingSetup {
	/** Si hoy se puede guardar una tarjeta. En `false` no se ofrece el paso. */
	available: boolean;
	public_key: string;
	/** Contra dónde tokeniza el navegador. Vacío con la pasarela simulada. */
	api_url: string;
	acceptance_token: string;
	terms_url: string;
}

const setupSchema = z
	.object({
		available: z.boolean(),
		publicKey: z.string(),
		apiUrl: z.string(),
		acceptanceToken: z.string(),
		termsUrl: z.string()
	})
	.transform((setup): BillingSetup => ({
		available: setup.available,
		public_key: setup.publicKey,
		api_url: setup.apiUrl,
		acceptance_token: setup.acceptanceToken,
		terms_url: setup.termsUrl
	}));

export function getBillingSetup(clientIp: string | null): Promise<ApiResult<BillingSetup>> {
	return apiRequest('/billing/setup', setupSchema, { clientIp });
}
