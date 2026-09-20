import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { planCodeSchema } from '$lib/schemas/account';
import { checkoutSubscription, getSubscription } from '$lib/server/api/panel-team';
import { listPublicPlans } from '$lib/server/api/plans';
import { clientAddress, failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const [subscription, plans, { role }] = await Promise.all([
		getSubscription(panelContext(event)),
		listPublicPlans(clientAddress(event)),
		event.parent()
	]);

	return {
		subscription: orFail(subscription),
		// Sin los planes la página sigue sirviendo: se ve el plan de la tienda,
		// aunque no se pueda cambiar.
		plans: plans.ok ? plans.data : [],
		// Pagar es de la dueña: la API le niega esta ruta al personal.
		canPay: role === 'owner'
	};
};

export const actions: Actions = {
	pagar: async (event) => {
		const formData = await event.request.formData();
		const planCode = planCodeSchema.safeParse(formData.get('planCode'));

		if (!planCode.success) return fail(400, { error: 'Elige un plan.' });

		const result = await checkoutSubscription(panelContext(event), planCode.data);

		if (!result.ok) return failWith(result);

		// A la pasarela. Lo que confirma el pago es su evento, no este viaje.
		redirect(303, result.data.url);
	}
};
