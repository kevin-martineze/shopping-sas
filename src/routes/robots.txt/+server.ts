import type { RequestHandler } from './$types';
import { getStorefront } from '$lib/server/api/storefront';
import { publicContext } from '$lib/server/context';

export const GET: RequestHandler = async (event) => {
	const result = await getStorefront(publicContext(event));

	if (!result.ok) {
		return new Response('No pudimos armar robots.txt.', {
			status: 503,
			headers: { 'retry-after': '300' }
		});
	}

	const site = result.data.public_url.replace(/\/$/, '');

	// El panel, el carrito y los pedidos no se indexan.
	const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /carrito
Disallow: /pedido
Disallow: /favoritos
Disallow: /vista-previa

Sitemap: ${site}/sitemap.xml
`;

	return new Response(body, { headers: { 'content-type': 'text/plain' } });
};
