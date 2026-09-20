import type { PageServerLoad } from './$types';
import { listPayments } from '$lib/server/api/platform';
import { accountContext, orFail } from '$lib/server/context';

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/** El mes actual en Colombia (UTC−5, sin horario de verano). */
function currentMonth(): string {
	return new Date(Date.now() - 5 * 3_600_000).toISOString().slice(0, 7);
}

export const load: PageServerLoad = async (event) => {
	const requested = event.url.searchParams.get('mes');
	const month = requested && MONTH.test(requested) ? requested : currentMonth();

	return { report: orFail(await listPayments(accountContext(event), month)) };
};
