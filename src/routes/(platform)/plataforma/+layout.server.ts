import type { LayoutServerLoad } from './$types';
import { requirePlatformAdmin } from '$lib/server/auth';

export const load: LayoutServerLoad = async (event) => {
	const account = await requirePlatformAdmin(event);

	return {
		adminEmail: account.user.email,
		// Si además administra alguna tienda, el enlace al panel tiene sentido.
		hasStores: account.stores.length > 0
	};
};
