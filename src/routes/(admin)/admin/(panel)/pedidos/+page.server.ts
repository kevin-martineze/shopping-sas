import type { PageServerLoad } from './$types';
import { isOrderStatus } from '$lib/domain/orders';
import { listOrders } from '$lib/server/orders';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ url }) => {
	const statusParam = url.searchParams.get('estado');
	const page = Number(url.searchParams.get('pagina') ?? '1');

	const filters = {
		status: isOrderStatus(statusParam) ? statusParam : null,
		q: url.searchParams.get('q'),
		page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
	};

	const result = await listOrders(supabaseAdmin(), filters);

	return { ...result, filters };
};
