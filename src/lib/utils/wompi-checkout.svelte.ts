import type { ActionResult } from '@sveltejs/kit';
import type { WompiTransactionResult } from '$lib/utils/wompi-widget';

import { openWompiWidget, pagoConWidget } from '$lib/utils/wompi-widget';

/**
 * El flujo de cobro con el widget de Wompi, compartido por el pedido y el plan.
 *
 * Abre el widget con lo que devuelve la action; si la action no trae widget,
 * deja que SvelteKit siga su curso. Después de abrirlo, espera el evento de la
 * pasarela releyendo la página, y se rinde a los 60 s.
 *
 * Debe llamarse en el nivel superior de un componente: usa `$effect`.
 */

/** Cada cuánto se vuelve a leer la página mientras Wompi confirma. */
const INTERVALO_MS = 3_000;
/** Pasado este tiempo se deja de preguntar: el pago puede seguir en proceso. */
const TIEMPO_MAX_MS = 60_000;

export interface CobroWompiOpciones {
	/** Si el cobro ya se refleja en los datos de la página. */
	pagado: () => boolean;
	/** Vuelve a leer los datos del `load`. */
	recargar: () => Promise<void>;
}

export interface CobroWompi {
	/** Desde que se pide el enlace hasta que el widget está abierto o se redirige. */
	readonly abriendo: boolean;
	/** Wompi aprobó o dejó pendiente el pago; se espera el evento que lo confirma. */
	readonly confirmando: boolean;
	/** Pasaron los 60 s sin confirmación: el pago puede seguir en proceso. */
	readonly expirado: boolean;
	/** Wompi no aprobó el pago. El botón vuelve a estar disponible. */
	readonly rechazado: boolean;
	/** Se llama antes de enviar el formulario de cobro. */
	iniciar(): void;
	/**
	 * Con el resultado de la action: abre el widget si lo hay. Si no, llama a
	 * `update` para que SvelteKit siga como siempre.
	 */
	procesar(result: ActionResult, update: () => Promise<void>): Promise<void>;
}

export function cobroWompi(opciones: CobroWompiOpciones): CobroWompi {
	let abriendo = $state(false);
	let confirmando = $state(false);
	let expirado = $state(false);
	let rechazado = $state(false);

	// Mientras Wompi confirma, se vuelve a leer la página hasta que llegue el evento.
	$effect(() => {
		if (!confirmando) return;

		const inicio = Date.now();
		const timer = setInterval(() => {
			if (opciones.pagado()) {
				confirmando = false;
				clearInterval(timer);

				return;
			}

			if (Date.now() - inicio >= TIEMPO_MAX_MS) {
				confirmando = false;
				expirado = true;
				clearInterval(timer);

				return;
			}

			void opciones.recargar();
		}, INTERVALO_MS);

		return () => clearInterval(timer);
	});

	/** Según la transacción que devuelve Wompi, espera la confirmación o avisa del rechazo. */
	function resultadoDelPago(transaccion: WompiTransactionResult | null) {
		if (!transaccion) return;

		if (transaccion.status === 'APPROVED' || transaccion.status === 'PENDING') {
			expirado = false;
			confirmando = true;

			return;
		}

		// DECLINED, ERROR, VOIDED y cualquier otro estado que no sea de éxito.
		rechazado = true;
	}

	return {
		get abriendo() {
			return abriendo;
		},
		get confirmando() {
			return confirmando;
		},
		get expirado() {
			return expirado;
		},
		get rechazado() {
			return rechazado;
		},

		iniciar() {
			abriendo = true;
			rechazado = false;
			expirado = false;
		},

		async procesar(result, update) {
			const pago = pagoConWidget(result);

			if (!pago) {
				await update();
				abriendo = false;

				return;
			}

			// Apenas el widget está abierto se reactiva el botón: el widget tapa la
			// página, y si la clienta lo cierra sin pagar, el botón ya está listo.
			try {
				await openWompiWidget(pago.widget, resultadoDelPago);
			} catch {
				// Si el script de Wompi no carga, la URL de respaldo lleva a la pasarela.
				window.location.href = pago.url;

				return;
			}

			abriendo = false;
		}
	};
}
