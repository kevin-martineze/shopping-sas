import { fail } from '@sveltejs/kit';

import type { ZoneInput } from '$lib/server/api/panel-commerce';
import type { Actions, PageServerLoad } from './$types';
import { shippingZoneSchema } from '$lib/schemas/admin';
import { createZone, listZones, removeZone, updateZone } from '$lib/server/api/panel-commerce';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	return { zones: orFail(await listZones(panelContext(event))) };
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

function toInput(zone: {
	name: string;
	cost: number;
	etaDays?: number | null;
	active: boolean;
	sortOrder: number;
}): ZoneInput {
	return {
		name: zone.name,
		cost: zone.cost,
		etaDays: zone.etaDays ?? null,
		active: zone.active,
		sortOrder: zone.sortOrder
	};
}

export const actions: Actions = {
	crear: async (event) => {
		const ctx = panelContext(event);
		const parsed = parseZone(await event.request.formData());

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const result = await createZone(ctx, toInput(parsed.data));

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	actualizar: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const parsed = parseZone(formData);

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const result = await updateZone(ctx, String(formData.get('id') ?? ''), toInput(parsed.data));

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	eliminar: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const result = await removeZone(ctx, String(formData.get('id') ?? ''));

		if (!result.ok) return failWith(result);

		if (result.data.result === 'deactivated') {
			return fail(409, { error: 'Esa zona ya se usó en pedidos, así que la desactivamos.' });
		}

		return { ok: true };
	}
};
