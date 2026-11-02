import type { ApiResult } from '$lib/server/api/client';
import type { PanelContext } from '$lib/server/context';
import type { SupportCategory, SupportList, SupportThread } from '$lib/domain/support';

import { panelRequest, segment } from '$lib/server/api/request';
import { storeListSchema, storeThreadSchema } from '$lib/server/api/support-common';

/** Centro de soporte desde la tienda: `/stores/:storeId/support/*`. Solo la dueña. */

export interface OpenTicketInput {
	subject: string;
	category: SupportCategory;
	body: string;
}

export function listSupportTickets(ctx: PanelContext): Promise<ApiResult<SupportList>> {
	return panelRequest(ctx, '/support/tickets', storeListSchema);
}

export function openSupportTicket(
	ctx: PanelContext,
	input: OpenTicketInput
): Promise<ApiResult<SupportThread>> {
	return panelRequest(ctx, '/support/tickets', storeThreadSchema, {
		method: 'POST',
		body: input
	});
}

export function getSupportThread(
	ctx: PanelContext,
	ticketId: string
): Promise<ApiResult<SupportThread>> {
	return panelRequest(ctx, `/support/tickets/${segment(ticketId)}`, storeThreadSchema);
}

export function replySupport(
	ctx: PanelContext,
	ticketId: string,
	body: string
): Promise<ApiResult<SupportThread>> {
	return panelRequest(ctx, `/support/tickets/${segment(ticketId)}/messages`, storeThreadSchema, {
		method: 'POST',
		body: { body }
	});
}
