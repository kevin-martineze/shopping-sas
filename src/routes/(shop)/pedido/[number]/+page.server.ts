import { error } from '@sveltejs/kit';

import type { PublicOrderView } from '$lib/domain/orders';
import type { Actions, PageServerLoad } from './$types';
import { getPublicOrder, markWhatsappOpened } from '$lib/server/api/checkout';
import { getOrderByNumber } from '$lib/server/api/panel-commerce';
import { panelContext, publicContext } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';
import { buildOrderMessage, buildWhatsAppUrl } from '$lib/utils/whatsapp';

export const load: PageServerLoad = async (event) => {
	const orderNumber = Number(event.params.number);

	if (!Number.isInteger(orderNumber) || orderNumber <= 0) error(404, 'Pedido no encontrado.');

	const token = event.url.searchParams.get('t');
	let order: PublicOrderView | null = null;

	// Con el token del enlace, quien lo tenga ve el pedido. Un token equivocado
	// responde igual que un pedido inexistente.
	if (token) {
		const result = await getPublicOrder(publicContext(event), orderNumber, token);

		if (result.ok) order = result.data;
		else if (result.status !== 400 && result.status !== 404) error(503, result.message);
	}

	// Sin un token válido, solo la administradora con sesión lo abre, desde el panel.
	if (!order && event.locals.session) {
		const result = await getOrderByNumber(panelContext(event), orderNumber);

		if (result.ok) order = result.data;
	}

	if (!order) {
		error(
			token ? 404 : 403,
			token ? 'Pedido no encontrado.' : 'Este enlace de pedido no es válido.'
		);
	}

	const { settings } = await event.parent();
	const orderUrl = new URL(
		`/pedido/${order.number}?t=${order.public_token}`,
		serverEnv().PUBLIC_SITE_URL
	).toString();

	const message = buildOrderMessage(order, { storeName: settings.store_name, orderUrl });

	return { order, whatsappUrl: buildWhatsAppUrl(settings.whatsapp_phone, message) };
};

export const actions: Actions = {
	/** Registra que la clienta sí llegó a abrir el chat. */
	abierto: async (event) => {
		const orderNumber = Number(event.params.number);
		const formData = await event.request.formData();
		const token = formData.get('t');

		if (!Number.isInteger(orderNumber) || typeof token !== 'string' || token === '') {
			return { ok: false };
		}

		const result = await markWhatsappOpened(publicContext(event), orderNumber, token);

		return { ok: result.ok };
	}
};
