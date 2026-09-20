import { describe, expect, it, vi } from 'vitest';

/**
 * El esquema del entorno con variables vacías, que es como quedan en Vercel
 * cuando un campo no aplica.
 */

const publicEnv: Record<string, string> = { PUBLIC_SITE_URL: 'https://globerce.store' };
const privateEnv: Record<string, string> = {
	API_URL: 'https://api.globerce.cloud/v1/',
	SESSION_SECRET: 'x'.repeat(40)
};

vi.mock('$env/dynamic/private', () => ({ env: privateEnv }));
vi.mock('$env/dynamic/public', () => ({ env: publicEnv }));

const { serverEnv, resetServerEnv } = await import('$lib/server/env');

describe('serverEnv', () => {
	it('trata una variable vacía como ausente', () => {
		publicEnv.PUBLIC_STORE_SLUG = '';
		publicEnv.PUBLIC_STORE_ROOT_DOMAIN = '';
		privateEnv.API_SHARED_SECRET = '';
		resetServerEnv();

		const env = serverEnv();

		expect(env.PUBLIC_STORE_SLUG).toBeUndefined();
		expect(env.PUBLIC_STORE_ROOT_DOMAIN).toBeUndefined();
		expect(env.API_SHARED_SECRET).toBeUndefined();
	});

	it('quita la barra final de la API', () => {
		resetServerEnv();

		expect(serverEnv().API_URL).toBe('https://api.globerce.cloud/v1');
	});

	it('un valor con formato equivocado sí falla, y dice cuál', () => {
		publicEnv.PUBLIC_STORE_SLUG = 'Mi Tienda';
		resetServerEnv();

		expect(() => serverEnv()).toThrow(/PUBLIC_STORE_SLUG/);
	});

	// Pasó en producción: en Vercel quedó pegado el comando de la terminal
	// entero, con saltos de línea, en vez del secreto. `fetch` moría con
	// «invalid header value» y parecía un problema de red.
	it('rechaza un secreto que no cabe en una cabecera HTTP', () => {
		publicEnv.PUBLIC_STORE_SLUG = '';
		privateEnv.API_SHARED_SECRET = `ssh ubuntu@1.2.3.4 "grep SECRET .env"\n${'x'.repeat(40)}`;
		resetServerEnv();

		expect(() => serverEnv()).toThrow(/API_SHARED_SECRET/);
	});
});
