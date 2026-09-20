import type { Actions, PageServerLoad } from './$types';
import { getDashboard, reconcile } from '$lib/server/api/platform';
import { accountContext, failWith, orFail } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	return { dashboard: orFail(await getDashboard(accountContext(event))) };
};

export const actions: Actions = {
	vencimientos: async (event) => {
		const result = await reconcile(accountContext(event));

		if (!result.ok) return failWith(result);

		const count = result.data.markedPastDue;

		return {
			message:
				count === 0
					? 'Ninguna tienda pasó a vencida.'
					: `${count} ${count === 1 ? 'tienda pasó' : 'tiendas pasaron'} a vencida.`
		};
	}
};
