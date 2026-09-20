import type { PageServerLoad } from './$types';
import { isOrderStatus } from '$lib/domain/orders';
import { listOrders } from '$lib/server/api/panel-commerce';
import { orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const statusParam = event.url.searchParams.get('estado');
	const page = Number(event.url.searchParams.get('pagina') ?? '1');

	const filters = {
		status: isOrderStatus(statusParam) ? statusParam : null,
		q: event.url.searchParams.get('q'),
		page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
	};

	const result = orFail(await listOrders(panelContext(event), filters));

	return { ...result, filters };
};
