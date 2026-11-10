import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { settingsSchema } from '$lib/schemas/admin';
import {
	getSettings,
	removeStoreLogo,
	updateSettings,
	uploadStoreLogo
} from '$lib/server/api/panel-content';
import { failWith, orFail, panelContext } from '$lib/server/context';

/** Logo: JPG, PNG, WebP o SVG; la API lo convierte. El tope es el del formulario. */
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const LOGO_MAX_BYTES = 2 * 1024 * 1024;

export const load: PageServerLoad = async (event) => {
	return { current: orFail(await getSettings(panelContext(event))) };
};

export const actions: Actions = {
	// Con acciones con nombre (`subirLogo`, `quitarLogo`) SvelteKit no admite `default`:
	// cualquier envío de la página respondería 500.
	guardar: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const parsed = settingsSchema.safeParse({
			storeName: formData.get('storeName'),
			whatsappPhone: String(formData.get('whatsappPhone') ?? '').replace(/\D/g, ''),
			instagramUrl: formData.get('instagramUrl') ?? '',
			announcement: formData.get('announcement') ?? '',
			freeShippingThreshold: String(formData.get('freeShippingThreshold') ?? '') || null
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const input = parsed.data;

		const result = await updateSettings(ctx, {
			storeName: input.storeName,
			whatsappPhone: input.whatsappPhone,
			instagramUrl: input.instagramUrl || null,
			announcement: input.announcement || null,
			freeShippingThreshold: input.freeShippingThreshold || null
		});

		if (!result.ok) return failWith(result);

		return { message: 'Ajustes guardados.' };
	},

	// Mismas claves que el resto del panel: `error` y `message` se avisan con toast.
	subirLogo: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const file = formData.get('file');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Elige una imagen para el logo.' });
		}

		if (!LOGO_TYPES.includes(file.type)) {
			return fail(400, { error: 'El logo debe ser PNG, JPG, WebP o SVG.' });
		}

		if (file.size > LOGO_MAX_BYTES) {
			return fail(400, { error: 'El logo pesa más de 2 MB. Pruébalo más liviano.' });
		}

		const result = await uploadStoreLogo(ctx, file);

		if (!result.ok) {
			const failure = failWith(result);

			return fail(failure.status, { error: result.message });
		}

		return { message: 'Logo guardado. La tienda ya lo muestra.' };
	},

	quitarLogo: async (event) => {
		const result = await removeStoreLogo(panelContext(event));

		if (!result.ok) {
			const failure = failWith(result);

			return fail(failure.status, { error: result.message });
		}

		return { message: 'Quitaste el logo: la tienda vuelve a mostrar el nombre.' };
	}
};
