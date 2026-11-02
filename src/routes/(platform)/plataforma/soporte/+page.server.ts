import type { PageServerLoad } from './$types';
import { parsePlatformSupportFilters } from '$lib/schemas/support';
import { listPlatformSupport } from '$lib/server/api/platform-support';
import { accountContext, orFail } from '$lib/server/context';

/** La bandeja del equipo. Los filtros viven en la URL: se pueden compartir y volver con el botón atrás. */
export const load: PageServerLoad = async (event) => {
	const ctx = accountContext(event);
	const filters = parsePlatformSupportFilters(event.url.searchParams);

	return { filters, list: orFail(await listPlatformSupport(ctx, filters)) };
};
