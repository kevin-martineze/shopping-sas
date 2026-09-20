import type { PageServerLoad } from './$types';
import { getDashboard, listOrders } from '$lib/server/api/panel-commerce';
import { orFail, panelContext, storeUrl } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ctx = panelContext(event);

	const [stats, recent] = await Promise.all([
		getDashboard(ctx),
		listOrders(ctx, { status: null, q: null, page: 1 })
	]);

	const { storeSlug } = await event.parent();

	return {
		stats: orFail(stats),
		recentOrders: orFail(recent).orders.slice(0, 8),
		// Recién creada: se muestra dónde quedó. Solo si es la tienda de la sesión,
		// para que el parámetro no sirva para pintar un enlace cualquiera.
		welcomeUrl: event.url.searchParams.get('bienvenida') === storeSlug ? storeUrl(storeSlug) : null
	};
};
