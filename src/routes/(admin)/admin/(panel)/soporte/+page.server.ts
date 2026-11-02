import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { supportTicketSchema } from '$lib/schemas/support';
import { listSupportTickets, openSupportTicket } from '$lib/server/api/panel-support';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	return { support: orFail(await listSupportTickets(panelContext(event))) };
};

export const actions: Actions = {
	crear: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const parsed = supportTicketSchema.safeParse({
			subject: formData.get('subject'),
			category: formData.get('category'),
			body: formData.get('body')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const result = await openSupportTicket(ctx, parsed.data);

		if (!result.ok) return failWith(result);

		redirect(303, `/admin/soporte/${result.data.ticket.id}`);
	}
};
