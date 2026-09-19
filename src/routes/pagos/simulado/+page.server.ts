import { error, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { approveSimulatedPayment } from '$lib/server/api/payments';
import { clientAddress } from '$lib/server/context';

/**
 * La pasarela de mentira.
 *
 * Es la página a la que lleva `PAYMENTS_DRIVER=simulated`: hace de Wompi para
 * poder recorrer el flujo entero —crear el cobro, aprobarlo, confirmarlo con
 * un evento— sin abrir una cuenta de comercio y sin cobrarle a nadie.
 *
 * Aprobar desde aquí es, literalmente, regalar un mes. Por eso la API solo
 * atiende ese evento con la pasarela simulada encendida, que nunca es la de
 * por defecto.
 */
export const load: PageServerLoad = ({ url }) => {
	const referencia = url.searchParams.get('referencia');
	const monto = Number(url.searchParams.get('monto') ?? '0');

	if (!referencia || !Number.isFinite(monto) || monto <= 0) {
		error(400, 'Este cobro no es válido.');
	}

	return {
		referencia,
		monto,
		concepto: url.searchParams.get('concepto') ?? 'Pago',
		// A dónde se vuelve, pase lo que pase.
		volver: url.searchParams.get('volver') ?? '/admin/plan'
	};
};

export const actions: Actions = {
	aprobar: async (event) => {
		const formData = await event.request.formData();
		const referencia = String(formData.get('referencia') ?? '');
		const monto = Number(formData.get('monto') ?? '0');
		const volver = String(formData.get('volver') ?? '/admin/plan');

		if (!referencia || !Number.isFinite(monto)) error(400, 'Este cobro no es válido.');

		await approveSimulatedPayment(referencia, monto, clientAddress(event));

		redirect(303, volver);
	}
};
