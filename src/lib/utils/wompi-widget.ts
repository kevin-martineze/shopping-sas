import type { WompiWidget } from '$lib/domain/wompi';

/**
 * El widget embebido de Wompi, solo para el navegador.
 *
 * Abre el pago dentro de la tienda en vez de mandar a la clienta a la página
 * de Wompi. Los datos y la firma llegan ya armados desde la API: aquí solo se
 * reenvían al widget, nunca se firma nada.
 */

const WIDGET_SRC = 'https://checkout.wompi.co/widget.js';

export interface WompiTransactionResult {
	id: string;
	status: string;
}

/** La carga se comparte: sin esto, dos clics meten dos `<script>` de Wompi. */
let cargando: Promise<void> | null = null;

/** Mete el script de Wompi una sola vez. Si falla, se puede volver a intentar. */
export function loadWompiWidget(): Promise<void> {
	if (window.WidgetCheckout) return Promise.resolve();

	if (!cargando) {
		cargando = new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');

			script.src = WIDGET_SRC;
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => {
				script.remove();
				cargando = null;
				reject(new Error('No se pudo cargar el pago de Wompi.'));
			};

			document.head.appendChild(script);
		});
	}

	return cargando;
}

/**
 * Abre el widget. La promesa resuelve cuando el widget ya está abierto, no
 * cuando termina el pago: el resultado llega después, por `onResult`.
 *
 * `onResult` recibe la transacción, o `null` si Wompi no trae ninguna.
 */
export async function openWompiWidget(
	widget: WompiWidget,
	onResult: (transaccion: WompiTransactionResult | null) => void
): Promise<void> {
	await loadWompiWidget();

	const Checkout = window.WidgetCheckout;

	if (!Checkout) throw new Error('El pago de Wompi no está disponible.');

	const checkout = new Checkout({
		currency: widget.currency,
		amountInCents: widget.amount_in_cents,
		reference: widget.reference,
		publicKey: widget.public_key,
		signature: { integrity: widget.integrity_signature },
		redirectUrl: widget.redirect_url,
		...(widget.customer_email ? { customerData: { email: widget.customer_email } } : {})
	});

	checkout.open((result) => onResult(result.transaction ?? null));
}
