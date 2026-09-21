import { error, fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { isOrderStatus } from '$lib/domain/orders';
import { getOrder, updateOrder } from '$lib/server/api/panel-commerce';
import { failWith, orFail, panelContext } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';
import { buildOrderMessage, buildWhatsAppUrl } from '$lib/utils/whatsapp';

export const load: PageServerLoad = async (event) => {
	const result = await getOrder(panelContext(event), event.params.id);

	if (!result.ok && (result.status === 404 || result.status === 400)) {
		error(404, 'Pedido no encontrado.');
	}

	const order = orFail(result);
	const { settings } = await event.parent();

	const orderUrl = new URL(
		`/pedido/${order.number}?t=${order.public_token}`,
		serverEnv().PUBLIC_SITE_URL
	).toString();

	// Enlace para volver a escribirle a el cliente con el pedido a la vista.
	const customerChatUrl = buildWhatsAppUrl(
		order.customer_phone,
		buildOrderMessage(order, { storeName: settings.store_name, orderUrl })
	);

	return { order, customerChatUrl, orderUrl };
};

export const actions: Actions = {
	estado: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const status = formData.get('status');

		if (typeof status !== 'string' || !isOrderStatus(status)) {
			return fail(400, { error: 'Estado inválido.' });
		}

		// Cancelar devuelve stock y cupón; un pedido cancelado no se reabre. Lo
		// decide la API y su mensaje explica por qué.
		const result = await updateOrder(ctx, event.params.id, { status });

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	notas: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const notes = String(formData.get('adminNotes') ?? '').slice(0, 1000);

		const result = await updateOrder(ctx, event.params.id, { adminNotes: notes });

		if (!result.ok) return failWith(result);

		return { ok: true };
	}
};
