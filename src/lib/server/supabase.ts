import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import { serverEnv } from '$lib/server/env';

let adminClient: SupabaseClient | null = null;

/**
 * Cliente con service role: ignora RLS. Solo para código de servidor que ya
 * verificó que quien pide es la administradora, o para tareas internas
 * (subida de imágenes, lectura de pedidos). Nunca se expone al navegador.
 */
export function supabaseAdmin(): SupabaseClient {
	if (adminClient) return adminClient;

	const env = serverEnv();

	adminClient = createClient(env.PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
		auth: { persistSession: false, autoRefreshToken: false }
	});

	return adminClient;
}
