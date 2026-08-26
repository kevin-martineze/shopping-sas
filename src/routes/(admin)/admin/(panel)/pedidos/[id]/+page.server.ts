import { error, fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { isOrderStatus } from '$lib/domain/orders';
import { getOrderById, setOrderStatus } from '$lib/server/orders';
import { serverEnv } from '$lib/server/env';
import { getSettings } from '$lib/server/store';
import { supabaseAdmin } from '$lib/server/supabase';
import { buildOrderMessage, buildWhatsAppUrl } from '$lib/utils/whatsapp';

export const load: PageServerLoad = async ({ params, locals }) => {
	const order = await getOrderById(supabaseAdmin(), params.id);

	if (!order) error(404, 'Pedido no encontrado.');

	const settings = await getSettings(locals.supabase);
	const orderUrl = new URL(
		`/pedido/${order.number}?t=${order.public_token}`,
		serverEnv().PUBLIC_SITE_URL
	).toString();

	// Enlace para volver a escribirle a la clienta con el pedido a la vista.
	const customerChatUrl = buildWhatsAppUrl(
		order.customer_phone,
		buildOrderMessage(order, { storeName: settings.store_name, orderUrl })
	);

	return { order, customerChatUrl, orderUrl };
};

export const actions: Actions = {
	estado: async ({ request, params }) => {
		const formData = await request.formData();
		const status = formData.get('status');

		if (typeof status !== 'string' || !isOrderStatus(status)) {
			return fail(400, { error: 'Estado inválido.' });
		}

		try {
			await setOrderStatus(supabaseAdmin(), params.id, status);
		} catch {
			return fail(500, { error: 'No pudimos cambiar el estado.' });
		}

		return { ok: true };
	},

	notas: async ({ request, params }) => {
		const formData = await request.formData();
		const notes = String(formData.get('adminNotes') ?? '').slice(0, 1000);

		const { error: updateError } = await supabaseAdmin()
			.from('orders')
			.update({ admin_notes: notes })
			.eq('id', params.id);

		if (updateError) return fail(500, { error: 'No pudimos guardar la nota.' });

		return { ok: true };
	}
};
