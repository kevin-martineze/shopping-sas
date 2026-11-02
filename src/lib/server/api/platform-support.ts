import type { ApiResult } from '$lib/server/api/client';
import type { AccountContext } from '$lib/server/context';
import type { PlatformSupportFilters } from '$lib/schemas/support';
import type {
	PlatformSupportList,
	PlatformSupportThread,
	SupportStatus
} from '$lib/domain/support';

import { apiRequest, type ResponseSchema } from '$lib/server/api/client';
import { segment } from '$lib/server/api/request';
import { platformListSchema, platformThreadSchema } from '$lib/server/api/support-common';

/** Bandeja del equipo de soporte: `/platform/support/*`. Solo administradores de la plataforma. */

function platformSupportRequest<T>(
	ctx: AccountContext,
	path: string,
	schema: ResponseSchema<T>,
	options: { method?: 'GET' | 'POST' | 'PATCH'; body?: unknown } = {}
): Promise<ApiResult<T>> {
	return apiRequest(`/platform/support${path}`, schema, {
		...options,
		accessToken: ctx.accessToken,
		clientIp: ctx.clientIp
	});
}

function threadPath(storeId: string, ticketId: string): string {
	return `/stores/${segment(storeId)}/tickets/${segment(ticketId)}`;
}

export function listPlatformSupport(
	ctx: AccountContext,
	filters: PlatformSupportFilters
): Promise<ApiResult<PlatformSupportList>> {
	const params = new URLSearchParams();

	if (filters.status) params.set('status', filters.status);
	if (filters.q) params.set('q', filters.q);
	if (filters.page > 1) params.set('page', String(filters.page));

	const query = params.toString();

	return platformSupportRequest(ctx, `/tickets${query ? `?${query}` : ''}`, platformListSchema);
}

export function getPlatformThread(
	ctx: AccountContext,
	storeId: string,
	ticketId: string
): Promise<ApiResult<PlatformSupportThread>> {
	return platformSupportRequest(ctx, threadPath(storeId, ticketId), platformThreadSchema);
}

export function replyPlatformSupport(
	ctx: AccountContext,
	storeId: string,
	ticketId: string,
	body: string
): Promise<ApiResult<PlatformSupportThread>> {
	return platformSupportRequest(
		ctx,
		`${threadPath(storeId, ticketId)}/messages`,
		platformThreadSchema,
		{
			method: 'POST',
			body: { body }
		}
	);
}

export function setPlatformSupportStatus(
	ctx: AccountContext,
	storeId: string,
	ticketId: string,
	status: SupportStatus
): Promise<ApiResult<PlatformSupportThread>> {
	return platformSupportRequest(ctx, threadPath(storeId, ticketId), platformThreadSchema, {
		method: 'PATCH',
		body: { status }
	});
}
