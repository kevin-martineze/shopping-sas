import type { PageServerLoad } from './$types';
import { listPublicPlans } from '$lib/server/api/plans';
import { clientAddress } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const plans = await listPublicPlans(clientAddress(event));

	return {
		// Si la API no responde, el sitio se muestra igual: una portada sin
		// precios vende menos que una portada, pero mucho más que un error.
		plans: plans.ok ? plans.data : [],
		signedIn: event.locals.session !== null
	};
};
