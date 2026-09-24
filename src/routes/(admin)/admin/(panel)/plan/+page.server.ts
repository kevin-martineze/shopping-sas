import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { planCodeSchema, paymentTokensSchema } from '$lib/schemas/account';
import { getBillingSetup } from '$lib/server/api/billing';
import {
	checkoutSubscription,
	getSubscription,
	removePaymentMethod,
	savePaymentMethod
} from '$lib/server/api/panel-team';
import { listPublicPlans } from '$lib/server/api/plans';
import { clientAddress, failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ip = clientAddress(event);
	const [subscription, plans, billing, { role }] = await Promise.all([
		getSubscription(panelContext(event)),
		listPublicPlans(ip),
		getBillingSetup(ip),
		event.parent()
	]);

	return {
		subscription: orFail(subscription),
		// Sin pasarela no se ofrece guardar tarjeta; el pago a mano sigue igual.
		billing: billing.ok
			? billing.data
			: { available: false, public_key: '', api_url: '', acceptance_token: '', terms_url: '' },
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
	},

	/**
	 * Guarda la tarjeta con que se cobrará el plan.
	 *
	 * Lo que llega es un token hecho en el navegador, nunca un número: si acá
	 * apareciera uno sería un error de programación, y el esquema lo corta.
	 */
	tarjeta: async (event) => {
		const formData = await event.request.formData();
		const parsed = paymentTokensSchema.safeParse({
			cardToken: formData.get('cardToken'),
			acceptanceToken: formData.get('acceptanceToken')
		});

		if (!parsed.success) {
			return fail(400, { error: 'No pudimos validar tu tarjeta. Inténtalo otra vez.' });
		}

		const result = await savePaymentMethod(panelContext(event), parsed.data);

		if (!result.ok) return failWith(result);

		return { message: 'Tu plan se cobrará solo con esta tarjeta.' };
	},

	quitarTarjeta: async (event) => {
		const result = await removePaymentMethod(panelContext(event));

		if (!result.ok) return failWith(result);

		return { message: 'Quitamos tu tarjeta. Tendrás que pagar cada mes a mano.' };
	}
};
