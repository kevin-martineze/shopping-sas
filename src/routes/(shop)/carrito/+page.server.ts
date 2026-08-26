import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { checkoutSchema } from '$lib/schemas/checkout';
import { checkCoupon, computeTotals, parseCartPayload, priceCart } from '$lib/server/cart';
import { createOrder } from '$lib/server/orders';
import { getSettings, getShippingZone, listShippingZones } from '$lib/server/store';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ locals }) => {
	return { zones: await listShippingZones(locals.supabase) };
};

export const actions: Actions = {
	/**
	 * Revalida el carrito del navegador contra la base: precios frescos, stock
	 * real, cupón y envío. Es lo que se muestra antes de confirmar.
	 */
	preparar: async ({ request, locals }) => {
		const formData = await request.formData();
		const lines = parseCartPayload(formData.get('cart'));
		const couponCode = String(formData.get('couponCode') ?? '').trim();
		const zoneId = String(formData.get('shippingZoneId') ?? '').trim() || null;

		const [priced, settings, zone] = await Promise.all([
			priceCart(locals.supabase, lines),
			getSettings(locals.supabase),
			getShippingZone(locals.supabase, zoneId)
		]);

		const coupon = await checkCoupon(locals.supabase, couponCode, priced.subtotal);
		const totals = computeTotals(priced.subtotal, coupon.applied, zone, settings);

		return {
			priced,
			totals,
			coupon: coupon.applied,
			couponRejection: coupon.rejection,
			zoneId: zone?.id ?? null
		};
	},

	confirmar: async ({ request, cookies }) => {
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

		// La función SQL vuelve a validar todo: aquí solo traducimos el resultado.
		const result = await createOrder(supabaseAdmin(), {
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
		});

		if (!result.ok) {
			if (result.error === 'stock') {
				const detail = (result.items ?? [])
					.map((item) => `${item.product} ${item.color}/${item.size} (quedan ${item.available})`)
					.join(', ');

				return fail(409, {
					checkoutError: `Se agotaron algunas prendas mientras armabas el pedido: ${detail}. Ajusta las cantidades e intenta de nuevo.`
				});
			}

			if (result.error === 'coupon') {
				return fail(400, {
					checkoutError: 'El cupón dejó de ser válido. Quítalo e intenta de nuevo.'
				});
			}

			return fail(400, { checkoutError: 'No pudimos crear el pedido. Intenta de nuevo.' });
		}

		// Marca de propiedad del pedido para poder volver a abrirlo desde este dispositivo.
		cookies.set('ultimo-pedido', String(result.number), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !request.url.startsWith('http://localhost'),
			maxAge: 60 * 60 * 24 * 30
		});

		redirect(303, `/pedido/${result.number}?t=${result.token}`);
	}
};
