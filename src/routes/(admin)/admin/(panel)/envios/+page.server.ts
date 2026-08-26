import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { shippingZoneSchema } from '$lib/schemas/admin';
import { listShippingZones } from '$lib/server/store';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	return { zones: await listShippingZones(supabaseAdmin(), true) };
};

function parseZone(formData: FormData) {
	return shippingZoneSchema.safeParse({
		name: formData.get('name'),
		cost: formData.get('cost'),
		etaDays: String(formData.get('etaDays') ?? '') || null,
		active: formData.get('active') === 'on',
		sortOrder: formData.get('sortOrder') || 0
	});
}

export const actions: Actions = {
	crear: async ({ request }) => {
		const parsed = parseZone(await request.formData());

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const { error } = await supabaseAdmin()
			.from('shipping_zones')
			.insert({
				name: parsed.data.name,
				cost: parsed.data.cost,
				eta_days: parsed.data.etaDays ?? null,
				active: parsed.data.active,
				sort_order: parsed.data.sortOrder
			});

		if (error) return fail(500, { error: 'No pudimos crear la zona.' });

		return { ok: true };
	},

	actualizar: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const parsed = parseZone(formData);

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const { error } = await supabaseAdmin()
			.from('shipping_zones')
			.update({
				name: parsed.data.name,
				cost: parsed.data.cost,
				eta_days: parsed.data.etaDays ?? null,
				active: parsed.data.active,
				sort_order: parsed.data.sortOrder
			})
			.eq('id', id);

		if (error) return fail(500, { error: 'No pudimos guardar la zona.' });

		return { ok: true };
	},

	eliminar: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');

		const { error } = await supabaseAdmin().from('shipping_zones').delete().eq('id', id);

		if (error) {
			// Zona usada en pedidos: se desactiva para no romper el historial.
			await supabaseAdmin().from('shipping_zones').update({ active: false }).eq('id', id);
			return fail(409, { error: 'Esa zona ya se usó en pedidos, así que la desactivamos.' });
		}

		return { ok: true };
	}
};
