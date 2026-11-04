import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';
import { getHome, getProduct } from '$lib/server/api/storefront';
import { orFail, publicContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const { draftPreview } = await event.parent();
	const destination = event.request.headers.get('sec-fetch-dest');

	// Solo se entra desde el `iframe` del editor, con el borrador encendido.
	// Si alguien abre la URL a mano, la página no existe.
	if (!draftPreview || (destination !== null && destination !== 'iframe')) {
		error(404, 'Esta página no existe.');
	}

	const ctx = publicContext(event);
	const requested = event.url.searchParams.get('producto');

	if (requested) {
		return { product: orFail(await getProduct(ctx, requested)) };
	}

	// Sin producto elegido se muestra el más reciente: sirve para ver cómo cae
	// la ficha mientras se edita, sin tener que escribir un slug.
	const home = orFail(await getHome(ctx));
	const newest = home.newest.at(0) ?? home.featured.at(0);

	if (!newest) error(404, 'Todavía no hay productos para mostrar.');

	return { product: orFail(await getProduct(ctx, newest.slug)) };
};
