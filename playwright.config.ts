import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de navegador: lo que ninguna prueba unitaria alcanza.
 *
 * Corren contra el sitio DE VERDAD —el `pnpm dev` de este repositorio y la API
 * local—, porque lo que se quiere comprobar es justamente el pegado entre los
 * dos: que el carrito sobreviva a un recargue, que un pedido llegue a la base y
 * que el panel lo vea.
 *
 * Por eso no están en CI todavía: haría falta levantar la API y su Postgres al
 * lado (ver PENDIENTES.md en ecommerce-api). En local:
 *
 *   pnpm dev                 en una terminal, con la API corriendo
 *   pnpm test:browser        en otra
 */
export default defineConfig({
	testDir: 'e2e',
	// Una a la vez: comparten la misma base y se pisarían los datos.
	workers: 1,
	fullyParallel: false,
	reporter: process.env.CI ? 'github' : 'list',
	timeout: 30_000,
	expect: { timeout: 10_000 },

	use: {
		baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
		locale: 'es-CO',
		// Al fallar, una traza vale más que cualquier mensaje.
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure'
	},

	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
