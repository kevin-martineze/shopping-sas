import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { supportReplySchema, supportStatusSchema } from '$lib/schemas/support';
import {
	getPlatformThread,
	replyPlatformSupport,
	setPlatformSupportStatus
} from '$lib/server/api/platform-support';
import { accountContext, failWith, orFail } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ctx = accountContext(event);
	const { storeId, ticketId } = event.params;

	return { thread: orFail(await getPlatformThread(ctx, storeId, ticketId)) };
};

export const actions: Actions = {
	responder: async (event) => {
		const ctx = accountContext(event);
		const formData = await event.request.formData();
		const parsed = supportReplySchema.safeParse({ body: formData.get('body') });

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Escribe tu mensaje.' });
		}

		const result = await replyPlatformSupport(
			ctx,
			event.params.storeId,
			event.params.ticketId,
			parsed.data.body
		);

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	estado: async (event) => {
		const ctx = accountContext(event);
		const formData = await event.request.formData();
		const status = supportStatusSchema.safeParse(formData.get('status'));

		if (!status.success) {
			return fail(400, { error: status.error.issues.at(0)?.message ?? 'Ese estado no existe.' });
		}

		const result = await setPlatformSupportStatus(
			ctx,
			event.params.storeId,
			event.params.ticketId,
			status.data
		);

		if (!result.ok) return failWith(result);

		return { ok: true };
	}
};
