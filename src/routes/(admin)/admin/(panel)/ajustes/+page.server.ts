import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { settingsSchema } from '$lib/schemas/admin';
import { getSettings, updateSettings } from '$lib/server/api/panel-content';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	return { current: orFail(await getSettings(panelContext(event))) };
};

export const actions: Actions = {
	default: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const parsed = settingsSchema.safeParse({
			storeName: formData.get('storeName'),
			whatsappPhone: String(formData.get('whatsappPhone') ?? '').replace(/\D/g, ''),
			instagramUrl: formData.get('instagramUrl') ?? '',
			announcement: formData.get('announcement') ?? '',
			freeShippingThreshold: String(formData.get('freeShippingThreshold') ?? '') || null
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const input = parsed.data;

		const result = await updateSettings(ctx, {
			storeName: input.storeName,
			whatsappPhone: input.whatsappPhone,
			instagramUrl: input.instagramUrl || null,
			announcement: input.announcement || null,
			freeShippingThreshold: input.freeShippingThreshold || null
		});

		if (!result.ok) return failWith(result);

		return { ok: true };
	}
};
