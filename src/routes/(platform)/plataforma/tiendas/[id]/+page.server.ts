import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { paymentSchema, planChangeSchema, storeStatusSchema } from '$lib/schemas/platform';
import {
	changePlan,
	getStore,
	listPlans,
	recordPayment,
	setStoreStatus
} from '$lib/server/api/platform';
import { accountContext, failWith, orFail, storeUrl } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ctx = accountContext(event);
	const [store, plans] = await Promise.all([getStore(ctx, event.params.id), listPlans(ctx)]);
	const detail = orFail(store);

	return { store: detail, plans: orFail(plans), storeUrl: storeUrl(detail.slug) };
};

export const actions: Actions = {
	pago: async (event) => {
		const ctx = accountContext(event);
		const formData = await event.request.formData();
		const parsed = paymentSchema.safeParse({
			amountCop: String(formData.get('amountCop') ?? '').replace(/\D/g, ''),
			periodStart: formData.get('periodStart'),
			periodEnd: formData.get('periodEnd'),
			method: formData.get('method'),
			reference: formData.get('reference') ?? ''
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa el pago.' });
		}

		const result = await recordPayment(ctx, event.params.id, {
			...parsed.data,
			reference: parsed.data.reference || null
		});

		if (!result.ok) return failWith(result);

		return { message: 'Pago registrado.' };
	},

	plan: async (event) => {
		const ctx = accountContext(event);
		const formData = await event.request.formData();
		const parsed = planChangeSchema.safeParse({
			planCode: formData.get('planCode'),
			notes: formData.get('notes') ?? ''
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa el plan.' });
		}

		const result = await changePlan(
			ctx,
			event.params.id,
			parsed.data.planCode,
			parsed.data.notes || null
		);

		if (!result.ok) return failWith(result);

		return { message: 'Plan actualizado. Los límites nuevos aplican desde ya.' };
	},

	estado: async (event) => {
		const ctx = accountContext(event);
		const formData = await event.request.formData();
		const status = storeStatusSchema.safeParse(formData.get('status'));

		if (!status.success) return fail(400, { error: status.error.issues[0]?.message });

		const result = await setStoreStatus(ctx, event.params.id, status.data);

		if (!result.ok) return failWith(result);

		return {
			message:
				status.data === 'suspended'
					? 'Tienda suspendida: no se ve en internet y su panel quedó en solo lectura.'
					: 'Tienda reactivada.'
		};
	}
};
