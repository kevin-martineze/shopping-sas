import type { RequestHandler } from './$types';
import { serverEnv } from '$lib/server/env';

export const GET: RequestHandler = async () => {
	const site = serverEnv().PUBLIC_SITE_URL.replace(/\/$/, '');

	// El panel, el carrito y los pedidos no se indexan.
	const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /carrito
Disallow: /pedido
Disallow: /favoritos

Sitemap: ${site}/sitemap.xml
`;

	return new Response(body, { headers: { 'content-type': 'text/plain' } });
};
