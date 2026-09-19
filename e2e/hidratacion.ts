import { expect, type Page } from '@playwright/test';

/**
 * Espera a que la página ya responda a JavaScript.
 *
 * Playwright hace clic en cuanto el HTML está; si Svelte todavía no hidrató, el
 * clic se lo lleva el navegador —envía el formulario, ignora el `onclick`— y la
 * prueba termina midiendo el camino sin JavaScript sin darse cuenta.
 *
 * En el registro la señal es la dirección, que sigue al nombre solo en el
 * cliente. Se escribe y se borra: el formulario queda como estaba.
 */
export async function esperarRegistroHidratado(page: Page): Promise<void> {
	await page.fill('input[name="storeName"]', 'Boutique Mariposa');
	await expect(page.locator('input[name="storeSlug"]')).toHaveValue('boutique-mariposa');
	await page.fill('input[name="storeName"]', '');
}
