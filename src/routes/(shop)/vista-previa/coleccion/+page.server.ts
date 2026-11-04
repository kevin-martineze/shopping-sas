import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getCollection } from '$lib/server/api/storefront';
import { orFail, publicContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const { draftPreview } = await event.parent();
	const destination = event.request.headers.get('sec-fetch-dest');

	// Solo se entra desde el `iframe` del editor, con el borrador encendido.
	// Si alguien abre la URL a mano, la página no existe.
	if (!draftPreview || (destination !== null && destination !== 'iframe')) {
		error(404, 'Esta página no existe.');
	}

	// Sin colección elegida no se carga ninguna: una colección nueva no debe
	// heredar la foto ni los productos de otra mientras la dueña escribe.
	const requested = event.url.searchParams.get('coleccion');

	if (!requested) return { collection: null };

	return { collection: orFail(await getCollection(publicContext(event), requested)) };
};
