import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { couponSchema } from '$lib/schemas/admin';
import {
	createCoupon,
	listCoupons,
	removeCoupon,
	setCouponActive
} from '$lib/server/api/panel-commerce';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	return { coupons: orFail(await listCoupons(panelContext(event))) };
};

export const actions: Actions = {
	crear: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const parsed = couponSchema.safeParse({
			code: formData.get('code'),
			type: formData.get('type'),
			value: formData.get('value'),
			minSubtotal: formData.get('minSubtotal') || 0,
			startsAt: formData.get('startsAt') ?? '',
			endsAt: formData.get('endsAt') ?? '',
			maxUses: String(formData.get('maxUses') ?? '') || null,
			active: formData.get('active') === 'on'
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const result = await createCoupon(ctx, parsed.data);

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	alternar: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const result = await setCouponActive(
			ctx,
			String(formData.get('id') ?? ''),
			formData.get('active') === 'true'
		);

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	eliminar: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const result = await removeCoupon(ctx, String(formData.get('id') ?? ''));

		if (!result.ok) return failWith(result);

		if (result.data.result === 'deactivated') {
			return fail(409, { error: 'Ese cupón ya se usó, así que lo desactivamos.' });
		}

		return { ok: true };
	}
};
