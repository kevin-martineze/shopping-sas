<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	import { enhance } from '$app/forms';

	import type { PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Separator } from '$lib/components/atoms/separator';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let openForm = $state<HTMLFormElement | null>(null);

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
			Ahora envíalo por WhatsApp para que {data.settings.store_name} lo confirme y coordine el pago.
		</p>
	</div>

	<form method="POST" action="?/abierto" bind:this={openForm} class="hidden" use:enhance></form>

	<div class="mt-8 space-y-3">
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
							{item.color_name} · Talla {item.size_label} · {item.qty}
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
