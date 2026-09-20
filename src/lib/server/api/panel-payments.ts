import type { ApiResult } from '$lib/server/api/client';
import type { PanelContext } from '$lib/server/context';

import { z } from 'zod';

import { panelRequest } from '$lib/server/api/request';

/**
 * La cuenta con la que la tienda cobra sus pedidos.
 *
 * Las llaves secretas viajan hacia la API y no vuelven nunca: lo que se lee
 * después es la pública y si está conectada o no. Este archivo no las guarda
 * ni las registra en ningún lado.
 */

export interface PaymentAccount {
	connected: boolean;
	provider: string;
	public_key: string | null;
	/** La URL que la dueña pega en el panel de la pasarela. */
	events_url: string;
	updated_at: string | null;
}

const accountSchema = z
	.object({
		connected: z.boolean(),
		provider: z.string(),
		publicKey: z.string().nullable(),
		eventsUrl: z.string(),
		updatedAt: z.string().nullable()
	})
	.transform((account): PaymentAccount => ({
		connected: account.connected,
		provider: account.provider,
		public_key: account.publicKey,
		events_url: account.eventsUrl,
		updated_at: account.updatedAt
	}));

export interface PaymentKeys {
	publicKey: string;
	privateKey: string;
	integritySecret: string;
	eventsSecret: string;
}

export function getPaymentAccount(ctx: PanelContext): Promise<ApiResult<PaymentAccount>> {
	return panelRequest(ctx, '/payments', accountSchema);
}

export function connectPaymentAccount(
	ctx: PanelContext,
	keys: PaymentKeys
): Promise<ApiResult<PaymentAccount>> {
	return panelRequest(ctx, '/payments', accountSchema, { method: 'PUT', body: keys });
}

export function disconnectPaymentAccount(ctx: PanelContext): Promise<ApiResult<PaymentAccount>> {
	return panelRequest(ctx, '/payments', accountSchema, { method: 'DELETE' });
}
