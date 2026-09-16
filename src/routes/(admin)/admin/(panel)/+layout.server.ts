import type { LayoutServerLoad } from './$types';
import { listOrders } from '$lib/server/api/panel-commerce';
import { getSettings } from '$lib/server/api/panel-content';
import { requireAdmin } from '$lib/server/auth';
import { orFail, panelContext } from '$lib/server/context';

export const load: LayoutServerLoad = async (event) => {
	const session = await requireAdmin(event);
	const ctx = panelContext(event);

	const [settings, pending] = await Promise.all([
		getSettings(ctx),
		listOrders(ctx, { status: 'pending', q: null, page: 1 })
	]);

	return {
		settings: orFail(settings),
		adminEmail: session.email,
		// El contador del menú es un extra: si falla, el panel se muestra igual.
		pendingOrders: pending.ok ? pending.data.total : 0
	};
};
