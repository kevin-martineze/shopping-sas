import { createHash } from 'node:crypto';

import { error, fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { checkoutSchema } from '$lib/schemas/checkout';
import {
	createOrder,
	listShippingZones,
	quoteCart,
	stockProblemsSchema
} from '$lib/server/api/checkout';
import { parseCartPayload } from '$lib/server/cart';
import { publicContext } from '$lib/server/context';

/** Dos envíos idénticos dentro de esta ventana son el mismo pedido. */
const DUPLICATE_WINDOW_MS = 2 * 60 * 1000;

export const load: PageServerLoad = async (event) => {
	const result = await listShippingZones(publicContext(event));

	if (!result.ok) error(503, result.message);

	return { zones: result.data };
};

export const actions: Actions = {
	/**
	 * Cotiza el carrito del navegador contra la API: precios frescos, stock real,
	 * cupón y envío. Es lo que se muestra antes de confirmar.
	 */
	preparar: async (event) => {
		const formData = await event.request.formData();
		const lines = parseCartPayload(formData.get('cart'));
		const couponCode = String(formData.get('couponCode') ?? '').trim();
		const zoneId = String(formData.get('shippingZoneId') ?? '').trim() || null;

		const result = await quoteCart(publicContext(event), lines, couponCode, zoneId);

		if (!result.ok) {
			return fail(result.status >= 400 && result.status < 500 ? result.status : 503, {
				quoteError: result.message
			});
		}

		return result.data;
	},

	confirmar: async (event) => {
		const { request, cookies } = event;
		const formData = await request.formData();
		const lines = parseCartPayload(formData.get('cart'));

		if (lines.length === 0) {
			return fail(400, { checkoutError: 'Tu carrito está vacío.' });
		}

		const parsed = checkoutSchema.safeParse({
			name: formData.get('name'),
			phone: formData.get('phone'),
			city: formData.get('city') ?? '',
			address: formData.get('address') ?? '',
			notes: formData.get('notes') ?? '',
			shippingZoneId: formData.get('shippingZoneId'),
			couponCode: formData.get('couponCode') ?? ''
		});

		if (!parsed.success) {
			return fail(400, {
				checkoutError: parsed.error.issues.at(0)?.message ?? 'Revisa los datos del pedido.',
				fieldErrors: parsed.error.flatten().fieldErrors
			});
		}

		const input = parsed.data;
		const ctx = publicContext(event);

		const order = {
			customer: {
				name: input.name,
				phone: input.phone,
				city: input.city,
				address: input.address,
				notes: input.notes
			},
			shippingZoneId: input.shippingZoneId,
			couponCode: input.couponCode === '' ? null : input.couponCode,
			items: lines
		};

		// La clave de idempotencia sale del contenido del envío: el doble clic con
		// la red lenta manda exactamente lo mismo segundos después y recibe el
		// mismo pedido, sin descontar el stock dos veces. Se agrupa en ventanas de
		// dos minutos para que la misma compra repetida a propósito más tarde sí
		// cree otro pedido. Un doble clic justo en el borde de la ventana podría
		// duplicarse; es un caso raro y el panel lo muestra.
		const idempotencyKey = createHash('sha256')
			.update(
				JSON.stringify([
					ctx.storeSlug,
					ctx.clientIp,
					order,
					Math.floor(Date.now() / DUPLICATE_WINDOW_MS)
				])
			)
			.digest('hex');

		const result = await createOrder(ctx, order, idempotencyKey);

		if (!result.ok) {
			if (result.code === 'out_of_stock') {
				const problems = stockProblemsSchema.safeParse(result.details);
				const detail = problems.success
					? problems.data
							.map(
								(item) => `${item.product} ${item.color}/${item.size} (quedan ${item.available})`
							)
							.join(', ')
					: '';

				return fail(409, {
					checkoutError: `Se agotaron algunas prendas mientras armabas el pedido${detail ? `: ${detail}` : ''}. Ajusta las cantidades e intenta de nuevo.`
				});
			}

			if (result.code === 'coupon_rejected') {
				return fail(400, { checkoutError: `${result.message} Quítalo e intenta de nuevo.` });
			}

			if (result.code === 'invalid_zone' || result.status === 429) {
				return fail(result.status, { checkoutError: result.message });
			}

			return fail(400, { checkoutError: 'No pudimos crear el pedido. Intenta de nuevo.' });
		}

		// Marca de propiedad del pedido para poder volver a abrirlo desde este dispositivo.
		cookies.set('ultimo-pedido', String(result.data.number), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !request.url.startsWith('http://localhost'),
			maxAge: 60 * 60 * 24 * 30
		});

		redirect(303, `/pedido/${result.data.number}?t=${result.data.token}`);
	}
};
