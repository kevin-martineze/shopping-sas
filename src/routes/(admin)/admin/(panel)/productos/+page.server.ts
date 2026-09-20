import type { PageServerLoad } from './$types';
import { listProducts } from '$lib/server/api/panel-catalog';
import { orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const search = event.url.searchParams.get('q');

	return {
		products: orFail(await listProducts(panelContext(event), search)),
		search
	};
};
