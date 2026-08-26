import type { PageServerLoad } from './$types';
import { getDashboardStats } from '$lib/server/admin';
import { listOrders } from '$lib/server/orders';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: PageServerLoad = async () => {
	const [stats, recent] = await Promise.all([
		getDashboardStats(),
		listOrders(supabaseAdmin(), { status: null, q: null, page: 1 })
	]);

	return { stats, recentOrders: recent.orders.slice(0, 8) };
};
