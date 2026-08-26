import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { settingsSchema } from '$lib/schemas/admin';
import { getSettings } from '$lib/server/store';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	return { current: await getSettings(locals.supabase) };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();

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

		const { error } = await supabaseAdmin()
			.from('settings')
			.update({
				store_name: input.storeName,
				whatsapp_phone: input.whatsappPhone,
				instagram_url: input.instagramUrl || null,
				announcement: input.announcement || null,
				free_shipping_threshold: input.freeShippingThreshold || null
			})
			.eq('id', true);

		if (error) return fail(500, { error: 'No pudimos guardar los ajustes.' });

		return { ok: true };
	}
};
