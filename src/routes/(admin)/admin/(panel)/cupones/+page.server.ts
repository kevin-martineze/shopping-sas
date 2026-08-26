import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { couponSchema } from '$lib/schemas/admin';
import { listCoupons } from '$lib/server/admin';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	return { coupons: await listCoupons() };
};

export const actions: Actions = {
	crear: async ({ request }) => {
		const formData = await request.formData();

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

		const input = parsed.data;

		const { error } = await supabaseAdmin()
			.from('coupons')
			.insert({
				code: input.code,
				type: input.type,
				value: input.value,
				min_subtotal: input.minSubtotal,
				starts_at: input.startsAt || null,
				ends_at: input.endsAt || null,
				max_uses: input.maxUses ?? null,
				active: input.active
			});

		if (error) {
			return fail(400, {
				error: error.code === '23505' ? 'Ya existe un cupón con ese código.' : 'No pudimos crearlo.'
			});
		}

		return { ok: true };
	},

	alternar: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const active = formData.get('active') === 'true';

		const { error } = await supabaseAdmin().from('coupons').update({ active }).eq('id', id);

		if (error) return fail(500, { error: 'No pudimos cambiar el cupón.' });

		return { ok: true };
	},

	eliminar: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		const { error } = await supabaseAdmin().from('coupons').delete().eq('id', id);

		if (error) {
			// Cupón ya usado en un pedido: se desactiva para no romper el historial.
			await supabaseAdmin().from('coupons').update({ active: false }).eq('id', id);
			return fail(409, { error: 'Ese cupón ya se usó, así que lo desactivamos.' });
		}

		return { ok: true };
	}
};
