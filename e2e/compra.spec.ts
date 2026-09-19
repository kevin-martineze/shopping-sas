import { expect, test } from '@playwright/test';

/**
 * El camino que decide si el producto sirve: alguien entra, elige una prenda,
 * la pone en el carrito y el carrito sigue ahí cuando vuelve.
 *
 * Corre contra la tienda por defecto del entorno local, con sus prendas de
 * prueba. No confirma el pedido a propósito: eso descontaría inventario de
 * verdad en cada corrida. Lo que puede romperse en el frontend —elegir
 * variante, el carrito, que sobreviva al recargue— está cubierto hasta el paso
 * anterior; que `create_order` hace lo suyo lo prueban los e2e de la API,
 * contra la base.
 */

test('una prenda llega al carrito y el carrito sobrevive al recargue', async ({ page }) => {
	await page.goto('/tienda');

	await page.locator('article a[href^="/tienda/"]').first().click();

	// El clic vuelve en cuanto la navegación arranca, así que el título que se
	// lee abajo puede ser todavía el del listado. Esperar al botón de comprar
	// —que solo existe en la ficha— es lo que asegura que ya estamos en ella.
	const comprar = page.getByRole('button', { name: /^(Agregar|Elige talla)/ }).first();

	await expect(comprar).toBeVisible();

	const nombre = (await page.getByRole('heading', { level: 1 }).first().innerText()).trim();

	// Color primero: las tallas disponibles dependen de él.
	const colores = page.locator('section', { hasText: 'Color' }).locator('button[aria-label]');

	if ((await colores.count()) > 0) await colores.first().click();

	// El botón solo dice «Agregar» cuando la variante elegida tiene stock; si la
	// talla está agotada se prueba la siguiente.
	const agregar = page.getByRole('button', { name: /^Agregar/ }).first();
	const tallas = page.locator('section', { hasText: 'Talla' }).locator('button[aria-pressed]');

	for (const talla of await tallas.all()) {
		await talla.click();
		if (await agregar.isVisible()) break;
	}

	await expect(agregar).toBeVisible();
	await agregar.click();

	await page.goto('/carrito');
	await expect(page.getByText(nombre, { exact: false }).first()).toBeVisible();

	// El carrito vive en el navegador: si no sobrevive a esto, no sirve de nada.
	await page.reload();
	await expect(page.getByText(nombre, { exact: false }).first()).toBeVisible();
});

test('la portada lleva a la tienda y muestra prendas', async ({ page }) => {
	await page.goto('/');

	await page
		.getByRole('link', { name: /ver la tienda/i })
		.first()
		.click();

	await expect(page).toHaveURL(/\/tienda/);
	await expect(page.locator('article a[href^="/tienda/"]').first()).toBeVisible();
});
