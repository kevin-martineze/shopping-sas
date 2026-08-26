import type { PageServerLoad } from './$types';
import { listAdminProducts } from '$lib/server/admin';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q');

	return {
		products: await listAdminProducts(search),
		search
	};
};
