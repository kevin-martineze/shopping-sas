/**
 * Las capturas de una tienda real que usa el sitio comercial, y la tarjeta
 * social (`static/og.png`) dibujada con ellas.
 *
 * La landing enseña maquetas en HTML para el panel (`StorefrontMock`,
 * `PhoneMock`): no envejecen y no pesan. Pero «así se ve una tienda terminada»
 * convence más con la tienda de verdad, y por eso estas sí son fotos. Para que
 * no envejezcan sin remedio se regeneran con este script cuando cambie la
 * vitrina:
 *
 *   pnpm dev                                   (en otra terminal)
 *   node scripts/capturas-marketing.mjs http://casa-oliva.localhost:5173
 *
 * La tienda tiene que tener productos con fotos y una colección en portada.
 * Todo se hace con Playwright, que ya es dependencia: las fotos se pasan a
 * WebP en el propio navegador, sin herramientas aparte.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src/lib/assets/marketing');
const STORE = process.argv[2];

if (!STORE) {
	console.error(
		'Falta la dirección de la tienda. Ej: node scripts/capturas-marketing.mjs http://casa-oliva.localhost:5173'
	);
	process.exit(1);
}

/** Recorre la página para que carguen las fotos perezosas, y vuelve arriba. */
async function settle(page) {
	await page.waitForLoadState('networkidle');
	await page.evaluate(async () => {
		for (let y = 0; y < document.body.scrollHeight; y += 400) {
			window.scrollTo(0, y);
			await new Promise((resolve) => setTimeout(resolve, 120));
		}
		window.scrollTo(0, 0);
	});
	await page.waitForLoadState('networkidle');
	await page.waitForTimeout(1000);
}

/** El primer enlace a un producto cuyo slug empiece así, o el primero que haya. */
async function productHref(page, prefix) {
	const preferred = page.locator(`a[href^="/tienda/${prefix}"]`).first();
	if ((await preferred.count()) > 0) return preferred.getAttribute('href');
	return page.locator('a[href^="/tienda/"]').first().getAttribute('href');
}

/**
 * Pasa un PNG a WebP en los anchos pedidos, con un canvas del navegador.
 * Devuelve un archivo por ancho: `<nombre>-<ancho>.webp`.
 */
async function toWebp(page, png, name, widths, crop = null) {
	const dataUrl = `data:image/png;base64,${png.toString('base64')}`;

	for (const width of widths) {
		const webp = await page.evaluate(
			async ({ dataUrl, width, crop }) => {
				const image = new Image();
				image.src = dataUrl;
				await image.decode();

				const source = crop
					? {
							x: 0,
							y: crop.top * image.naturalHeight,
							w: image.naturalWidth,
							h: (crop.bottom - crop.top) * image.naturalHeight
						}
					: { x: 0, y: 0, w: image.naturalWidth, h: image.naturalHeight };
				const height = Math.round((source.h / source.w) * width);

				const canvas = document.createElement('canvas');
				canvas.width = width;
				canvas.height = height;
				const context = canvas.getContext('2d');
				context.imageSmoothingQuality = 'high';
				context.drawImage(image, source.x, source.y, source.w, source.h, 0, 0, width, height);

				return canvas.toDataURL('image/webp', 0.86).split(',')[1];
			},
			{ dataUrl, width, crop }
		);

		const file = join(OUT, `${name}-${width}.webp`);
		writeFileSync(file, Buffer.from(webp, 'base64'));
		console.log(
			'  ',
			file.replace(`${ROOT}/`, ''),
			`${Math.round(Buffer.from(webp, 'base64').length / 1024)} KB`
		);
	}
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

// Escritorio: 1440 de ancho, a 2x para que se lea nítido encogido.
const desktop = await browser.newContext({
	viewport: { width: 1440, height: 900 },
	deviceScaleFactor: 2,
	locale: 'es-CO'
});
const d = await desktop.newPage();

await d.goto(`${STORE}/`);
await settle(d);
const portada = await d.screenshot();
await d.evaluate(() => window.scrollTo(0, 900));
await d.waitForTimeout(800);
const destacados = await d.screenshot();

// Celular: el de un teléfono corriente, a 3x.
const mobile = await browser.newContext({
	viewport: { width: 390, height: 844 },
	deviceScaleFactor: 3,
	isMobile: true,
	hasTouch: true,
	locale: 'es-CO'
});
const m = await mobile.newPage();

await m.goto(`${STORE}/tienda`);
await settle(m);
const catalogo = await m.screenshot();
await m.goto(`${STORE}${await productHref(m, 'conjunto')}`);
await settle(m);
const producto = await m.screenshot();

console.log('Capturas en WebP:');
await toWebp(d, portada, 'tienda-portada', [960, 1920]);
// Solo la franja de destacados: título y la fila de productos con su precio.
await toWebp(d, destacados, 'tienda-destacados', [960, 1920], { top: 0.19, bottom: 0.92 });
await toWebp(d, catalogo, 'tienda-catalogo-celular', [300, 600]);
await toWebp(d, producto, 'tienda-producto-celular', [300, 600]);

// La tarjeta social: la de siempre, con la tienda de verdad a la derecha.
const fonts = pathToFileURL(join(ROOT, 'node_modules/@fontsource-variable')).href;
const logo = pathToFileURL(join(ROOT, 'src/lib/assets/logo.png')).href;
const asData = (png) => `data:image/png;base64,${png.toString('base64')}`;

const og = await browser.newContext({
	viewport: { width: 1200, height: 630 },
	deviceScaleFactor: 1
});
const o = await og.newPage();
// En un archivo y no con `setContent`: una página en blanco no puede leer
// las fuentes ni el logo de `file://`.
const tmp = mkdtempSync(join(tmpdir(), 'globerce-og-'));
const ogHtml = join(tmp, 'og.html');
writeFileSync(
	ogHtml,
	`<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Hanken; src: url('${fonts}/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2'); font-weight: 100 900; }
@font-face { font-family: Fraunces; src: url('${fonts}/fraunces/files/fraunces-latin-opsz-normal.woff2'); font-weight: 100 900; }
@font-face { font-family: Fraunces; font-style: italic; src: url('${fonts}/fraunces/files/fraunces-latin-opsz-italic.woff2'); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; position: relative; font-family: Hanken, sans-serif; color: #fff;
  background: radial-gradient(700px 520px at 92% 70%, #1b3a38 0%, transparent 70%), #0e1a1c; }
.marca { position: absolute; left: 72px; top: 58px; display: flex; align-items: center; gap: 14px; font-family: Fraunces, serif; font-size: 34px; }
.marca img { width: 50px; height: 50px; }
h1 { position: absolute; left: 72px; top: 170px; width: 560px; font-family: Fraunces, serif; font-weight: 400; font-size: 68px; line-height: 1.06; letter-spacing: -0.01em; }
h1 em { color: #4fa9a2; }
p { position: absolute; left: 72px; top: 410px; width: 520px; font-size: 22px; line-height: 1.45; color: rgb(255 255 255 / 72%); }
.chips { position: absolute; left: 72px; bottom: 56px; display: flex; gap: 14px; font-family: ui-monospace, monospace; font-size: 17px; }
.chips span { padding: 11px 22px; border-radius: 999px; border: 1px solid rgb(255 255 255 / 16%); color: rgb(255 255 255 / 82%); }
.browser { position: absolute; left: 660px; top: 92px; width: 640px; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 40px 80px -20px rgb(0 0 0 / 60%); }
.barra { height: 26px; background: #f4f2ee; display: flex; gap: 6px; align-items: center; padding: 0 12px; }
.barra i { width: 9px; height: 9px; border-radius: 50%; background: #d9d4cb; }
.browser img { display: block; width: 100%; }
.phone { position: absolute; left: 905px; top: 250px; width: 190px; padding: 8px; border-radius: 34px; background: #111; box-shadow: 0 40px 70px -16px rgb(0 0 0 / 70%), inset 0 0 0 2px #2c2c2c; }
.phone img { display: block; width: 100%; border-radius: 27px; }
</style></head><body>
<div class="marca"><img src="${logo}" alt="">Globerce</div>
<h1>Tu tienda responde <em>«¿queda?»</em> por ti</h1>
<p>Catálogo, inventario y pagos en línea. Lista hoy, sin comisión por venta.</p>
<div class="chips"><span>14 días gratis</span><span>Sin comisión por venta</span></div>
<div class="browser"><div class="barra"><i></i><i></i><i></i></div><img src="${asData(portada)}" alt=""></div>
<div class="phone"><img src="${asData(catalogo)}" alt=""></div>
</body></html>`
);
await o.goto(pathToFileURL(ogHtml).href);
await o.evaluate(() => document.fonts.ready);
await o.waitForTimeout(500);
await o.screenshot({ path: join(ROOT, 'static/og.png') });
rmSync(tmp, { recursive: true, force: true });
console.log('Tarjeta social: static/og.png');

await browser.close();
