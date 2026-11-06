import type { AdminSession } from '$lib/server/session-crypto';

declare global {
	/** El script de Wompi (`widget.js`) agrega esta clase a `window` al cargar. */
	interface Window {
		WidgetCheckout?: new (config: {
			currency: string;
			amountInCents: number;
			reference: string;
			publicKey: string;
			signature: { integrity: string };
			redirectUrl?: string;
			customerData?: { email?: string };
		}) => {
			open: (callback: (result: { transaction?: { id: string; status: string } }) => void) => void;
		};
	}

	namespace App {
		interface Locals {
			/**
			 * Sesión del panel emitida por la API, ya renovada si hacía falta, o null.
			 * Comprobar que la membresía sigue viva es trabajo de `requireAdmin`.
			 */
			session: AdminSession | null;
			/** Tienda de un dominio propio, resuelta en `hooks.server.ts`. Los demás hosts la leen del subdominio. */
			storeSlug?: string;
		}

		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
