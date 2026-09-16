import type { PageServerLoad } from './$types';
import { getDashboard, listOrders } from '$lib/server/api/panel-commerce';
import { orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ctx = panelContext(event);

	const [stats, recent] = await Promise.all([
		getDashboard(ctx),
		listOrders(ctx, { status: null, q: null, page: 1 })
	]);

	return { stats: orFail(stats), recentOrders: orFail(recent).orders.slice(0, 8) };
};
