import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { paymentKeysSchema } from '$lib/schemas/admin';
import {
	connectPaymentAccount,
	disconnectPaymentAccount,
	getPaymentAccount
} from '$lib/server/api/panel-payments';
import { failWith, orFail, panelContext } from '$lib/server/context';
import { fieldErrors } from '$lib/utils/form';

export const load: PageServerLoad = async (event) => {
	const [account, { role }] = await Promise.all([
		getPaymentAccount(panelContext(event)),
		event.parent()
	]);

	return { account: orFail(account), canManage: role === 'owner' };
};

export const actions: Actions = {
	conectar: async (event) => {
		const formData = await event.request.formData();
		const parsed = paymentKeysSchema.safeParse({
			publicKey: formData.get('publicKey'),
			privateKey: formData.get('privateKey'),
			integritySecret: formData.get('integritySecret'),
			eventsSecret: formData.get('eventsSecret')
		});

		if (!parsed.success) return fail(400, { errors: fieldErrors(parsed.error) });

		const result = await connectPaymentAccount(panelContext(event), parsed.data);

		if (!result.ok) return failWith(result);

		// Las llaves no vuelven a la página ni para confirmar: se dice que quedó.
		return { message: 'Tu tienda ya puede cobrar en línea.' };
	},

	desconectar: async (event) => {
		const result = await disconnectPaymentAccount(panelContext(event));

		if (!result.ok) return failWith(result);

		return { message: 'Tu tienda dejó de cobrar en línea.' };
	}
};
