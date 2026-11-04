import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { listShippingZones } from '$lib/server/api/checkout';
import { orFail, publicContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const { draftPreview } = await event.parent();
	const destination = event.request.headers.get('sec-fetch-dest');

	// Solo se entra desde el `iframe` del editor, con el borrador encendido.
	// Si alguien abre la URL a mano, la página no existe.
	if (!draftPreview || (destination !== null && destination !== 'iframe')) {
		error(404, 'Esta página no existe.');
	}

	// Las zonas guardadas sirven de base: el borrador del panel las reemplaza
	// mientras la dueña edita. El carrito de la tienda no se toca.
	return { zones: orFail(await listShippingZones(publicContext(event))) };
};
