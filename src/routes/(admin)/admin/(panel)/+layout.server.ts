import type { LayoutServerLoad } from './$types';
import { subscriptionNotice } from '$lib/domain/account';
import { listOrders } from '$lib/server/api/panel-commerce';
import { getSettings } from '$lib/server/api/panel-content';
import { listSupportTickets } from '$lib/server/api/panel-support';
import { getSubscription } from '$lib/server/api/panel-team';
import { requireAdmin } from '$lib/server/auth';
import { orFail, panelContext, storeUrl } from '$lib/server/context';

export const load: LayoutServerLoad = async (event) => {
	const { account, store } = await requireAdmin(event);
	const ctx = panelContext(event);

	const [settings, pending, subscription, support] = await Promise.all([
		getSettings(ctx),
		listOrders(ctx, { status: 'pending', q: null, page: 1 }),
		getSubscription(ctx),
		listSupportTickets(ctx)
	]);

	return {
		settings: orFail(settings),
		adminEmail: account.user.email,
		role: store.role,
		storeSlug: store.slug,
		// "Ver tienda": la dirección pública (dominio propio si lo tiene), no el subdominio.
		storeUrl: orFail(settings).public_url,
		// Vistas previas en iframe: siempre el subdominio, que es del mismo sitio que el panel.
		previewUrl: storeUrl(store.slug),
		// Para el selector de la barra: las otras tiendas de esta cuenta.
		otherStores: account.stores
			.filter((candidate) => candidate.id !== store.id)
			.map((candidate) => ({ id: candidate.id, name: candidate.name })),
		isPlatformAdmin: account.isPlatformAdmin,
		// El contador y el aviso son extras: si fallan, el panel se muestra igual.
		pendingOrders: pending.ok ? pending.data.total : 0,
		// Respuestas del equipo sin abrir: el contador del menú de soporte.
		supportUnread: support.ok ? support.data.unread_replies : 0,
		notice: subscription.ok ? subscriptionNotice(subscription.data) : null
	};
};
