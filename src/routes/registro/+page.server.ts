import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import type { ApiFailure } from '$lib/server/api/client';
import type { FieldErrors } from '$lib/utils/form';
import { planCodeSchema, registerSchema, storeFieldsSchema } from '$lib/schemas/account';
import { createStore, register } from '$lib/server/api/auth';
import { listPublicPlans } from '$lib/server/api/plans';
import { accountContext, clientAddress, displayStatus } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';
import { toAdminSession, writeSession } from '$lib/server/session';
import { fieldErrors } from '$lib/utils/form';

export const load: PageServerLoad = async (event) => {
	const rootDomain = serverEnv().PUBLIC_STORE_ROOT_DOMAIN;
	const plans = await listPublicPlans(clientAddress(event));
	// Sin planes se registra igual y la API pone el básico: no poder mostrar los
	// precios no puede ser motivo para no dejar abrir la tienda.
	const disponibles = plans.ok ? plans.data : [];
	const pedido = event.url.searchParams.get('plan');

	return {
		// Con sesión se crea una tienda más para esa cuenta: no se piden sus datos.
		signedIn: event.locals.session !== null,
		addressSuffix: rootDomain ? `.${rootDomain}` : null,
		plans: disponibles,
		// El que venía de la página de precios; si no, el primero de la lista.
		selectedPlan: disponibles.find((plan) => plan.code === pedido)?.code ?? disponibles[0]?.code
	};
};

/**
 * Un choque de la API va bajo el campo que lo causó; lo demás, arriba del
 * formulario. Se decide por el código y no por el texto, que cambia.
 */
function apiError(result: ApiFailure): { error?: string; errors?: FieldErrors } {
	if (result.code === 'email_taken') return { errors: { email: result.message } };
	if (result.code === 'slug_taken') return { errors: { storeSlug: result.message } };

	return { error: result.message };
}

export const actions: Actions = {
	default: async (event) => {
		const { request, cookies, locals } = event;
		const formData = await request.formData();
		const ip = clientAddress(event);
		const text = (field: string) => String(formData.get(field) ?? '');

		const fields = {
			storeName: text('storeName'),
			storeSlug: text('storeSlug'),
			whatsappPhone: text('whatsappPhone'),
			fullName: text('fullName'),
			email: text('email'),
			password: text('password'),
			confirm: text('confirm')
		};

		// Un plan que no exista no frena el registro: la API cae en el básico y la
		// tienda lo cambia después desde su panel.
		const plan = planCodeSchema.safeParse(formData.get('planCode'));
		const planCode = plan.success ? plan.data : undefined;

		// Lo tecleado vuelve a la página para no perderlo si algo falla. Las
		// contraseñas no: no viajan de vuelta ni para eso.
		const values = {
			storeName: fields.storeName,
			storeSlug: fields.storeSlug,
			whatsappPhone: fields.whatsappPhone,
			fullName: fields.fullName,
			email: fields.email,
			planCode
		};

		if (locals.session) {
			const parsed = storeFieldsSchema.safeParse(fields);

			if (!parsed.success) {
				return fail(400, { errors: fieldErrors(parsed.error), values });
			}

			const result = await createStore(
				accountContext(event),
				{ ...parsed.data, planCode },
				locals.session.refreshToken
			);

			if (!result.ok) return fail(displayStatus(result), { ...apiError(result), values });

			writeSession(cookies, toAdminSession(result.data));
			// La tienda ya existe; lo primero que se elige es con qué se viste.
			redirect(303, '/admin/bienvenida');
		}

		const parsed = registerSchema.safeParse(fields);

		if (!parsed.success) {
			return fail(400, { errors: fieldErrors(parsed.error), values });
		}

		const result = await register(
			{
				storeName: parsed.data.storeName,
				storeSlug: parsed.data.storeSlug,
				whatsappPhone: parsed.data.whatsappPhone,
				fullName: parsed.data.fullName,
				email: parsed.data.email,
				password: parsed.data.password,
				planCode
			},
			ip
		);

		if (!result.ok) return fail(displayStatus(result), { ...apiError(result), values });

		writeSession(cookies, toAdminSession(result.data));
		redirect(303, '/admin/bienvenida');
	}
};
