import type { Plan } from '$lib/domain/account';
import type { ApiResult } from '$lib/server/api/client';

import { z } from 'zod';

import { apiRequest } from '$lib/server/api/client';
import { planSchema } from '$lib/server/api/panel-team';

/**
 * Los planes que se anuncian en el sitio comercial.
 *
 * Sin sesión y sin tienda: es la única llamada que no cuelga de ninguna de las
 * dos. Los precios y los límites salen de la API para que cambiarlos en la
 * consola cambie la página de precios, sin tocar código.
 */
export function listPublicPlans(clientIp: string | null): Promise<ApiResult<Plan[]>> {
	return apiRequest('/plans', z.array(planSchema), { clientIp });
}
