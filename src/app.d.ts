import type { AdminSession } from '$lib/server/session-crypto';

declare global {
	namespace App {
		interface Locals {
			/**
			 * Sesión del panel emitida por la API, ya renovada si hacía falta, o null.
			 * Comprobar que la membresía sigue viva es trabajo de `requireAdmin`.
			 */
			session: AdminSession | null;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
