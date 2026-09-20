import type { RequestHandler } from './$types';
import { getSitemap } from '$lib/server/api/storefront';
import { publicContext } from '$lib/server/context';
import { serverEnv } from '$lib/server/env';

export const GET: RequestHandler = async (event) => {
	const site = serverEnv().PUBLIC_SITE_URL.replace(/\/$/, '');
	const result = await getSitemap(publicContext(event));

	// Un 503 con Retry-After hace que el buscador vuelva luego. Un sitemap vacío
	// le diría que la tienda no tiene páginas.
	if (!result.ok) {
		return new Response('No pudimos armar el sitemap.', {
			status: 503,
			headers: { 'retry-after': '300' }
		});
	}

	const { products, collections, categories } = result.data;

	const urls = [
		{ loc: `${site}/`, lastmod: null },
		{ loc: `${site}/tienda`, lastmod: null },
		{ loc: `${site}/colecciones`, lastmod: null },
		...categories.map((slug) => ({ loc: `${site}/tienda?categoria=${slug}`, lastmod: null })),
		...collections.map((slug) => ({ loc: `${site}/colecciones/${slug}`, lastmod: null })),
		...products.map((product) => ({
			loc: `${site}/tienda/${product.slug}`,
			lastmod: product.updatedAt
		}))
	];

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
	.map(
		(url) =>
			`	<url><loc>${url.loc.replace(/&/g, '&amp;')}</loc>${
				url.lastmod ? `<lastmod>${url.lastmod.slice(0, 10)}</lastmod>` : ''
			}</url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(body, {
		headers: {
			'content-type': 'application/xml',
			'cache-control': 'max-age=0, s-maxage=3600'
		}
	});
};
