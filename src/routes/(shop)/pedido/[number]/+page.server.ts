import { error } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { getOrderByNumber, markWhatsAppOpened } from '$lib/server/orders';
import { serverEnv } from '$lib/server/env';
import { getSettings } from '$lib/server/store';
import { supabaseAdmin } from '$lib/server/supabase';
import { buildOrderMessage, buildWhatsAppUrl } from '$lib/utils/whatsapp';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const orderNumber = Number(params.number);

	if (!Number.isInteger(orderNumber)) error(404, 'Pedido no encontrado.');

	// Los pedidos no son legibles con la clave anónima: se leen con service role
	// y se autoriza con el token del enlace (o con sesión de administradora).
	const order = await getOrderByNumber(supabaseAdmin(), orderNumber);

	if (!order) error(404, 'Pedido no encontrado.');

	const token = url.searchParams.get('t');
	const user = await locals.safeGetUser();

	if (token !== order.public_token && !user) {
		error(403, 'Este enlace de pedido no es válido.');
	}

	const settings = await getSettings(locals.supabase);
	const orderUrl = new URL(
		`/pedido/${order.number}?t=${order.public_token}`,
		serverEnv().PUBLIC_SITE_URL
	).toString();

	const message = buildOrderMessage(order, {
		storeName: settings.store_name,
		orderUrl
	});

	return {
		order,
		whatsappUrl: buildWhatsAppUrl(settings.whatsapp_phone, message)
	};
};

export const actions: Actions = {
	/** Registra que el cliente sí llegó a abrir el chat. */
	abierto: async ({ params }) => {
		const orderNumber = Number(params.number);
		if (!Number.isInteger(orderNumber)) return { ok: false };

		await markWhatsAppOpened(supabaseAdmin(), orderNumber);
		return { ok: true };
	}
};
