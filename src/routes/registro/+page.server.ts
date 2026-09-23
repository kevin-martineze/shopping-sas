import { fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import type { WompiKeys } from '$lib/domain/wompi';
import type { ApiFailure } from '$lib/server/api/client';
import type { AdminSession } from '$lib/server/session-crypto';
import type { FieldErrors } from '$lib/utils/form';
import { joinPhone } from '$lib/domain/phone';
import { completeWompiKeys, parseWompiKeys } from '$lib/domain/wompi';
import { planCodeSchema, registerSchema, storeFieldsSchema } from '$lib/schemas/account';
import { createStore, register } from '$lib/server/api/auth';
import { connectPaymentAccount } from '$lib/server/api/panel-payments';
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

/**
 * Conecta la cuenta de cobro de una tienda recién creada, y dice a dónde ir.
 *
 * Corre DESPUÉS de crear la tienda porque hace falta su sesión, y eso obliga a
 * una regla: un fallo acá no puede deshacer la tienda ni devolver el
 * formulario. La tienda ya existe; reenviarlo crearía otra. Así que se entra
 * igual, avisando de lo que quedó pendiente.
 *
 * Las llaves ya vinieron reconocidas: lo único que puede fallar acá es la API.
 */
async function conectarCobros(
	session: AdminSession,
	keys: WompiKeys | null,
	clientIp: string | null
): Promise<string> {
	if (!keys || !session.storeId) return '/admin/bienvenida';

	const result = await connectPaymentAccount(
		{ storeId: session.storeId, accessToken: session.accessToken, clientIp },
		keys
	);

	return result.ok ? '/admin/bienvenida' : '/admin/bienvenida?cobros=pendiente';
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
			// El indicativo llega en su propio campo: pegarlo en el cliente
			// obligaría a un input oculto, que sin JavaScript no se actualiza.
			whatsappPhone: joinPhone(text('whatsappPhoneCountry'), text('whatsappPhone')),
			fullName: text('fullName'),
			email: text('email'),
			password: text('password'),
			confirm: text('confirm')
		};

		// Un plan que no exista no frena el registro: la API cae en el básico y la
		// tienda lo cambia después desde su panel.
		const plan = planCodeSchema.safeParse(formData.get('planCode'));
		const planCode = plan.success ? plan.data : undefined;

		// Las llaves de Wompi son opcionales. Se reconocen ANTES de crear nada:
		// si el pegado no trae las cuatro, se puede devolver el formulario sin
		// que exista todavía una tienda a medio conectar.
		const pasteText = text('pasteText').trim();
		const keys = pasteText ? completeWompiKeys(parseWompiKeys(pasteText)) : null;

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

		// Lo pegado no vuelve a la página ni cuando falla: son secretos de cobro,
		// igual que las contraseñas.
		if (pasteText && !keys) {
			return fail(400, {
				errors: {
					pasteText:
						'No reconocimos las cuatro llaves en lo que pegaste. Revísalas, o deja el cuadro vacío y conéctalas luego desde Pagos.'
				},
				values
			});
		}

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

			const session = toAdminSession(result.data);

			writeSession(cookies, session);

			// La tienda ya existe; lo primero que se elige es con qué se viste.
			redirect(303, await conectarCobros(session, keys, ip));
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

		const session = toAdminSession(result.data);

		writeSession(cookies, session);
		redirect(303, await conectarCobros(session, keys, ip));
	}
};
