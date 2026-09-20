import type { PageServerLoad } from './$types';
import { storeFilterStatusSchema } from '$lib/schemas/platform';
import { listPlans, listStores } from '$lib/server/api/platform';
import { accountContext, orFail } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ctx = accountContext(event);
	const params = event.url.searchParams;
	const status = storeFilterStatusSchema.safeParse(params.get('estado'));

	const filters = {
		q: params.get('q')?.trim().slice(0, 120) || null,
		status: status.success ? status.data : null,
		overdue: params.get('vencidas') === '1'
	};

	const [stores, plans] = await Promise.all([listStores(ctx, filters), listPlans(ctx)]);

	return { stores: orFail(stores), plans: orFail(plans), filters };
};
