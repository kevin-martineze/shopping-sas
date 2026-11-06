import type { ApiResult } from '$lib/server/api/client';
import type { PanelContext } from '$lib/server/context';
import type { DomainState, StoreDomain } from '$lib/domain/domain';

import { z } from 'zod';

import { DOMAIN_STATUSES } from '$lib/domain/domain';
import { panelRequest } from '$lib/server/api/request';

/** Dominio propio del panel (`/stores/:storeId/domain` de la API). Solo `OWNER`. */

const dnsRecordSchema = z.object({
	type: z.enum(['A', 'CNAME', 'TXT']),
	name: z.string(),
	value: z.string()
});

const storeDomainSchema = z
	.object({
		host: z.string(),
		status: z.enum(DOMAIN_STATUSES),
		dnsRecords: z.array(dnsRecordSchema),
		verifiedAt: z.string().nullable(),
		lastError: z.string().nullable()
	})
	.transform((domain): StoreDomain => ({
		host: domain.host,
		status: domain.status,
		dns_records: domain.dnsRecords,
		verified_at: domain.verifiedAt,
		last_error: domain.lastError
	}));

const domainStateSchema = z.object({
	allowed: z.boolean(),
	domain: storeDomainSchema.nullable()
});

export function getDomain(ctx: PanelContext): Promise<ApiResult<DomainState>> {
	return panelRequest(ctx, '/domain', domainStateSchema);
}

/** Pone el dominio: queda `pending` hasta que la dueña verifique el DNS. */
export function saveDomain(ctx: PanelContext, host: string): Promise<ApiResult<StoreDomain>> {
	return panelRequest(ctx, '/domain', storeDomainSchema, { method: 'PUT', body: { host } });
}

export function verifyDomain(ctx: PanelContext): Promise<ApiResult<StoreDomain>> {
	return panelRequest(ctx, '/domain/verify', storeDomainSchema, { method: 'POST' });
}

export function removeDomain(ctx: PanelContext): Promise<ApiResult<undefined>> {
	return panelRequest(ctx, '/domain', z.undefined(), { method: 'DELETE' });
}
