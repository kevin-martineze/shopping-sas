import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { completeWompiKeys, parseWompiKeys } from '$lib/domain/wompi';
import { paymentKeysSchema } from '$lib/schemas/admin';
import {
	connectPaymentAccount,
	disconnectPaymentAccount,
	getPaymentAccount
} from '$lib/server/api/panel-payments';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const [account, { role }] = await Promise.all([
		getPaymentAccount(panelContext(event)),
		event.parent()
	]);

	return { account: orFail(account), canManage: role === 'owner' };
};

export const actions: Actions = {
	/**
	 * Lo único que viaja es el texto pegado: el servidor reconoce las cuatro
	 * llaves de ahí, con o sin JavaScript. Así no hay campos sueltos que puedan
	 * desfasarse del cuadro de pegado.
	 */
	conectar: async (event) => {
		const formData = await event.request.formData();
		const pasteText = String(formData.get('pasteText') ?? '');
		const keys = completeWompiKeys(parseWompiKeys(pasteText));

		if (!keys) {
			return fail(400, {
				error: 'No reconocimos las cuatro llaves en lo que pegaste. Revisa que vengan completas.'
			});
		}

		const parsed = paymentKeysSchema.safeParse(keys);

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0]?.message ?? 'Revisa las llaves.' });
		}

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
