<script lang="ts">
	import { untrack } from 'svelte';

	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import * as Card from '$lib/components/atoms/card';
	import { Separator } from '$lib/components/atoms/separator';
	import { Textarea } from '$lib/components/atoms/textarea';
	import { ORDER_STATUSES, ORDER_STATUS_LABEL } from '$lib/domain/orders';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	const order = $derived(data.order);

	// Copia editable de la nota guardada; no se sincroniza sola.
	let adminNotes = $state(untrack(() => data.order.admin_notes ?? ''));
	let savingNotes = $state(false);

	const dateFormatter = new Intl.DateTimeFormat('es-CO', {
		dateStyle: 'long',
		timeStyle: 'short'
	});
</script>

<svelte:head>
	<title>Pedido #{order.number} — Panel</title>
</svelte:head>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<a
			href="/admin/pedidos"
			class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
		>
			<ArrowLeft class="size-3" />
			Pedidos
		</a>
		<h1 class="mt-1 text-3xl">Pedido #{order.number}</h1>
		<p class="text-muted-foreground text-sm">
			{dateFormatter.format(new Date(order.created_at))}
			{#if order.whatsapp_opened_at}
				· la clienta abrió el chat
			{:else}
				· todavía no abrió el chat
			{/if}
		</p>
	</div>

	<div class="flex items-center gap-2">
		<Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
			{ORDER_STATUS_LABEL[order.status]}
		</Badge>

		<Button href={data.customerChatUrl} target="_blank" rel="noopener noreferrer" variant="outline">
			<MessageCircle class="mr-2 size-4" />
			Escribirle
		</Button>
	</div>
</div>

<FormFeedback error={form?.error ?? null} />

<div class="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
	<div class="space-y-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>Prendas</Card.Title>
			</Card.Header>

			<Card.Content>
				<ul class="divide-border divide-y">
					{#each order.items as item (item.id)}
						<li class="flex justify-between gap-4 py-3 text-sm">
							<div>
								<a href="/tienda/{item.product_slug}" class="font-medium">{item.product_name}</a>
								<p class="text-muted-foreground text-xs">
									{item.color_name} · Talla {item.size_label}
									{#if item.sku}· {item.sku}{/if}
								</p>
							</div>
							<div class="text-right">
								<p class="tabular-nums">{formatMoney(item.line_total)}</p>
								<p class="text-muted-foreground text-xs tabular-nums">
									{item.qty} × {formatMoney(item.unit_price)}
								</p>
							</div>
						</li>
					{/each}
				</ul>

				<Separator class="my-4" />

				<dl class="space-y-2 text-sm">
					<div class="flex justify-between">
						<dt class="text-muted-foreground">Subtotal</dt>
						<dd class="tabular-nums">{formatMoney(order.subtotal)}</dd>
					</div>

					{#if order.discount > 0}
						<div class="flex justify-between">
							<dt class="text-muted-foreground">
								Descuento {order.coupon_code ? `(${order.coupon_code})` : ''}
							</dt>
							<dd class="tabular-nums">-{formatMoney(order.discount)}</dd>
						</div>
					{/if}

					<div class="flex justify-between">
						<dt class="text-muted-foreground">
							Envío {order.shipping_zone_name ? `· ${order.shipping_zone_name}` : ''}
						</dt>
						<dd class="tabular-nums">{formatMoney(order.shipping_cost)}</dd>
					</div>

					<Separator />

					<div class="flex justify-between font-medium">
						<dt>Total</dt>
						<dd class="tabular-nums">{formatMoney(order.total)}</dd>
					</div>
				</dl>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Nota interna</Card.Title>
				<Card.Description>Solo la ves tú. Útil para acuerdos hechos por chat.</Card.Description>
			</Card.Header>

			<Card.Content>
				<form
					method="POST"
					action="?/notas"
					class="space-y-3"
					use:enhance={() => {
						savingNotes = true;

						return async ({ update }) => {
							await update({ reset: false });
							savingNotes = false;
						};
					}}
				>
					<Textarea name="adminNotes" bind:value={adminNotes} rows={3} />
					<Button type="submit" variant="outline" size="sm" disabled={savingNotes}>
						{savingNotes ? 'Guardando…' : 'Guardar nota'}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>
	</div>

	<div class="space-y-6">
		<Card.Root>
			<Card.Header>
				<Card.Title>Clienta</Card.Title>
			</Card.Header>

			<Card.Content class="space-y-1 text-sm">
				<p class="font-medium">{order.customer_name}</p>
				<p class="text-muted-foreground">{order.customer_phone}</p>
				{#if order.customer_city}<p class="text-muted-foreground">{order.customer_city}</p>{/if}
				{#if order.customer_address}<p class="text-muted-foreground">
						{order.customer_address}
					</p>{/if}
				{#if order.customer_notes}
					<p class="border-border mt-3 border-l-2 pl-3 text-xs">{order.customer_notes}</p>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Estado</Card.Title>
				<Card.Description>
					Cancelar devuelve el stock al inventario y libera el uso del cupón.
				</Card.Description>
			</Card.Header>

			<Card.Content>
				<div class="grid gap-2">
					{#each ORDER_STATUSES as status (status)}
						<form method="POST" action="?/estado" use:enhance>
							<input type="hidden" name="status" value={status} />
							<Button
								type="submit"
								variant={order.status === status ? 'default' : 'outline'}
								size="sm"
								class="w-full justify-start"
								disabled={order.status === status}
							>
								{ORDER_STATUS_LABEL[status]}
							</Button>
						</form>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Enlace del pedido</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="text-muted-foreground text-xs break-all">{data.orderUrl}</p>
			</Card.Content>
		</Card.Root>
	</div>
</div>
