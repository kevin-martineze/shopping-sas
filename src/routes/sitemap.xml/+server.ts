import type { RequestHandler } from './$types';
import { serverEnv } from '$lib/server/env';
import { supabaseAdmin } from '$lib/server/supabase';

export const GET: RequestHandler = async () => {
	const site = serverEnv().PUBLIC_SITE_URL.replace(/\/$/, '');
	const client = supabaseAdmin();

	const [products, collections, categories] = await Promise.all([
		client
			.from('products')
			.select('slug, updated_at')
			.eq('status', 'active')
			.returns<{ slug: string; updated_at: string }[]>(),
		client.from('collections').select('slug').eq('active', true).returns<{ slug: string }[]>(),
		client.from('categories').select('slug').eq('active', true).returns<{ slug: string }[]>()
	]);

	const urls = [
		{ loc: `${site}/`, lastmod: null },
		{ loc: `${site}/tienda`, lastmod: null },
		{ loc: `${site}/colecciones`, lastmod: null },
		...(categories.data ?? []).map((category) => ({
			loc: `${site}/tienda?categoria=${category.slug}`,
			lastmod: null
		})),
		...(collections.data ?? []).map((collection) => ({
			loc: `${site}/colecciones/${collection.slug}`,
			lastmod: null
		})),
		...(products.data ?? []).map((product) => ({
			loc: `${site}/tienda/${product.slug}`,
			lastmod: product.updated_at
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
