import type { LayoutServerLoad } from './$types';
import { requireAdmin } from '$lib/server/auth';
import { getSettings } from '$lib/server/store';
import { supabaseAdmin } from '$lib/server/supabase';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const user = await requireAdmin(locals, url.pathname);

	const [settings, pending] = await Promise.all([
		getSettings(locals.supabase),
		supabaseAdmin()
			.from('orders')
			.select('id', { count: 'exact', head: true })
			.eq('status', 'pending')
	]);

	return {
		settings,
		adminEmail: user.email ?? '',
		pendingOrders: pending.count ?? 0
	};
};
