<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	import type { ActionResult, SubmitFunction } from '@sveltejs/kit';
	import type { ActionData, PageData } from './$types';
	import type { WompiWidget } from '$lib/domain/wompi';
	import type { WompiTransactionResult } from '$lib/utils/wompi-widget';
	import { Button } from '$lib/components/atoms/button';
	import { Separator } from '$lib/components/atoms/separator';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatMoney } from '$lib/utils/money';
	import { openWompiWidget } from '$lib/utils/wompi-widget';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	/** Cada cuánto se vuelve a leer el pedido mientras Wompi confirma. */
	const INTERVALO_CONFIRMACION_MS = 3_000;
	/** Pasado este tiempo se deja de preguntar: el pago puede seguir en proceso. */
	const TIEMPO_CONFIRMACION_MS = 60_000;

	let openForm = $state<HTMLFormElement | null>(null);
	/** Desde que se pide el enlace hasta que el widget se cierra o redirige. */
	let abriendoPago = $state(false);
	/** Wompi aprobó o dejó pendiente el pago; se espera el evento que lo confirma. */
	let confirmando = $state(false);
	let expirado = $state(false);
	let pagoRechazado = $state(false);

	const pagado = $derived(data.order.payment_status === 'paid');
	const mostrarPago = $derived(data.canPayOnline && !pagado && !confirmando && !expirado);

	interface PagoConWidget {
		widget: WompiWidget;
		url: string;
	}

	function esRegistro(valor: unknown): valor is Record<string, unknown> {
		return typeof valor === 'object' && valor !== null;
	}

	/** Lee el widget que devuelve la action, campo a campo, sin confiar en la forma. */
	function esWidget(valor: unknown): valor is WompiWidget {
		if (!esRegistro(valor)) return false;

		return (
			typeof valor.public_key === 'string' &&
			valor.currency === 'COP' &&
			typeof valor.amount_in_cents === 'number' &&
			typeof valor.reference === 'string' &&
			typeof valor.integrity_signature === 'string' &&
			typeof valor.redirect_url === 'string' &&
			(valor.customer_email === null || typeof valor.customer_email === 'string')
		);
	}

	/** Solo hay pago con widget si la action trajo el widget y la URL de respaldo. */
	function pagoConWidget(result: ActionResult): PagoConWidget | null {
		if (result.type !== 'success') return null;

		const datos: unknown = result.data;

		if (!esRegistro(datos) || typeof datos.url !== 'string' || !esWidget(datos.widget)) {
			return null;
		}

		return { widget: datos.widget, url: datos.url };
	}

	/**
	 * Abre el widget y, según la transacción, espera la confirmación o avisa.
	 * Si el script de Wompi no carga, se redirige a la URL de respaldo.
	 */
	async function abrirPago(pago: PagoConWidget) {
		let transaccion: WompiTransactionResult | null;

		try {
			transaccion = await openWompiWidget(pago.widget);
		} catch {
			window.location.href = pago.url;

			return;
		}

		abriendoPago = false;

		if (!transaccion) return;

		if (transaccion.status === 'APPROVED' || transaccion.status === 'PENDING') {
			expirado = false;
			confirmando = true;

			return;
		}

		// DECLINED, ERROR, VOIDED y cualquier otro estado que no sea de éxito.
		pagoRechazado = true;
	}

	/** El botón se apaga mientras se pide el enlace o se abre el pago: son unos segundos y un cobro. */
	const pagando: SubmitFunction = () => {
		abriendoPago = true;
		pagoRechazado = false;

		return async ({ result, update }) => {
			const pago = pagoConWidget(result);

			if (!pago) {
				await update();
				abriendoPago = false;

				return;
			}

			await abrirPago(pago);
		};
	};

	// Mientras Wompi confirma, se vuelve a leer el pedido hasta que llegue el evento.
	$effect(() => {
		if (!confirmando) return;

		const inicio = Date.now();
		const timer = setInterval(() => {
			if (pagado) {
				confirmando = false;
				clearInterval(timer);

				return;
			}

			if (Date.now() - inicio >= TIEMPO_CONFIRMACION_MS) {
				confirmando = false;
				expirado = true;
				clearInterval(timer);

				return;
			}

			void invalidateAll();
		}, INTERVALO_CONFIRMACION_MS);

		return () => clearInterval(timer);
	});

	// El pedido ya está guardado: el carrito local deja de tener sentido.
	$effect(() => {
		cart.clear();
		cart.open = false;
	});

	function openWhatsApp() {
		openForm?.requestSubmit();
		window.open(data.whatsappUrl, '_blank', 'noopener');
	}
</script>

<svelte:head>
	<title>Pedido #{data.order.number} — {data.settings.store_name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-16 sm:px-6">
	<div class="space-y-3 text-center">
		<div
			class="bg-success text-success-foreground mx-auto grid size-12 place-items-center rounded-full"
		>
			<Check class="size-6" />
		</div>

		<p class="eyebrow">Paso 2 de 2</p>
		<h1 class="text-4xl md:text-5xl">Pedido #{data.order.number} guardado</h1>
		<p class="text-muted-foreground text-sm text-balance">
			{#if pagado}
				Tu pago quedó registrado. {data.settings.store_name} ya lo está preparando.
			{:else if data.canPayOnline}
				Págalo en línea o envíalo por WhatsApp: las dos cosas llegan a {data.settings.store_name}.
			{:else}
				Ahora envíalo por WhatsApp para que {data.settings.store_name} lo confirme y coordine el pago.
			{/if}
		</p>
	</div>

	<!-- El token va en el formulario: `?/abierto` reemplaza la query y se perdería el `?t=`. -->
	<form method="POST" action="?/abierto" bind:this={openForm} class="hidden" use:enhance>
		<input type="hidden" name="t" value={data.order.public_token} />
	</form>

	<div class="mt-8 space-y-3">
		{#if confirmando}
			<p class="text-muted-foreground text-center text-sm">
				Estamos confirmando tu pago con Wompi…
			</p>
		{:else if expirado}
			<p class="text-muted-foreground text-center text-sm">
				Tu pago está en proceso. Te avisaremos cuando Wompi lo confirme; puedes recargar esta
				página.
			</p>
		{/if}

		{#if mostrarPago}
			<form method="POST" action="?/pagar" use:enhance={pagando}>
				<input type="hidden" name="t" value={data.order.public_token} />
				<Button type="submit" size="lg" class="w-full" disabled={abriendoPago}>
					<CreditCard class="mr-2 size-5" />
					{abriendoPago ? 'Abriendo el pago…' : `Pagar ${formatMoney(data.order.total)} en línea`}
				</Button>
			</form>

			{#if pagoRechazado}
				<p class="text-destructive text-center text-sm">
					Tu pago no se aprobó. Puedes intentarlo de nuevo.
				</p>
			{/if}

			{#if form?.error}
				<p class="text-destructive text-center text-sm">{form.error}</p>
			{/if}

			<p class="text-muted-foreground text-center text-xs">
				Tarjeta, transferencia o billetera. O si prefieres:
			</p>
		{/if}

		<Button
			type="button"
			size="lg"
			class="bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 w-full"
			onclick={openWhatsApp}
		>
			<MessageCircle class="mr-2 size-5" />
			Enviar pedido por WhatsApp
		</Button>

		<p class="text-muted-foreground text-center text-xs">
			Si no se abre solo,
			<a href={data.whatsappUrl} target="_blank" rel="noopener noreferrer" class="underline">
				toca aquí
			</a>.
		</p>
	</div>

	<section class="border-border mt-12 border p-6">
		<h2 class="font-display mb-4 text-2xl">Detalle</h2>

		<ul class="divide-border divide-y">
			{#each data.order.items as item (item.id)}
				<li class="flex justify-between gap-4 py-3 text-sm">
					<div>
						<p class="font-medium">{item.product_name}</p>
						<p class="text-muted-foreground text-xs">
							{item.variant_label} · {item.qty}
							{item.qty === 1 ? 'unidad' : 'unidades'}
						</p>
					</div>
					<span class="tabular-nums">{formatMoney(item.line_total)}</span>
				</li>
			{/each}
		</ul>

		<Separator class="my-4" />

		<dl class="space-y-2 text-sm">
			<div class="flex justify-between">
				<dt class="text-muted-foreground">Subtotal</dt>
				<dd class="tabular-nums">{formatMoney(data.order.subtotal)}</dd>
			</div>

			{#if data.order.discount > 0}
				<div class="text-success flex justify-between">
					<dt>Descuento {data.order.coupon_code ? `(${data.order.coupon_code})` : ''}</dt>
					<dd class="tabular-nums">-{formatMoney(data.order.discount)}</dd>
				</div>
			{/if}

			<div class="flex justify-between">
				<dt class="text-muted-foreground">
					Envío {data.order.shipping_zone_name ? `· ${data.order.shipping_zone_name}` : ''}
				</dt>
				<dd class="tabular-nums">
					{data.order.shipping_cost === 0 ? 'Gratis' : formatMoney(data.order.shipping_cost)}
				</dd>
			</div>

			<Separator />

			<div class="flex justify-between text-base font-medium">
				<dt>Total</dt>
				<dd class="tabular-nums">{formatMoney(data.order.total)}</dd>
			</div>
		</dl>

		<Separator class="my-4" />

		<div class="text-muted-foreground space-y-1 text-xs">
			<p>{data.order.customer_name} · {data.order.customer_phone}</p>
			{#if data.order.customer_city}<p>{data.order.customer_city}</p>{/if}
			{#if data.order.customer_address}<p>{data.order.customer_address}</p>{/if}
		</div>
	</section>

	<div class="mt-8 text-center">
		<Button href="/tienda" variant="outline">Seguir viendo</Button>
	</div>
</div>
