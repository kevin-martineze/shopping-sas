import type { PageServerLoad } from './$types';
import { getSubscription } from '$lib/server/api/panel-team';
import { orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	return { subscription: orFail(await getSubscription(panelContext(event))) };
};
