<script lang="ts">
	import type { PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import { ORDER_STATUS_LABEL } from '$lib/domain/orders';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const stats = $derived(data.stats);

	const dateFormatter = new Intl.DateTimeFormat('es-CO', {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	});
</script>

<svelte:head>
	<title>Resumen — Panel</title>
</svelte:head>

<header class="mb-8 space-y-1">
	<h1 class="text-3xl">Resumen</h1>
	<p class="text-muted-foreground text-sm">Lo que necesita atención hoy.</p>
</header>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Pedidos pendientes</Card.Description>
			<Card.Title class="font-sans text-3xl tabular-nums">{stats.pendingOrders}</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if stats.stalePendingOrders > 0}
				<p class="text-sale text-xs">
					{stats.stalePendingOrders} llevan más de 24 h reteniendo stock.
				</p>
			{:else if stats.pendingOrders > 0}
				<p class="text-muted-foreground text-xs">Ninguno lleva más de 24 h esperando.</p>
			{:else}
				<p class="text-muted-foreground text-xs">Todo al día.</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Ventas del mes</Card.Description>
			<Card.Title class="font-sans text-3xl tabular-nums">
				{formatMoney(stats.monthRevenue)}
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-xs">{stats.monthOrders} pedidos sin cancelar.</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Stock bajo</Card.Description>
			<Card.Title class="font-sans text-3xl tabular-nums">{stats.lowStock.length}</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-xs">Variantes con 3 unidades o menos.</p>
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Avisos pendientes</Card.Description>
			<Card.Title class="font-sans text-3xl tabular-nums">{stats.pendingRestock}</Card.Title>
		</Card.Header>
		<Card.Content>
			<p class="text-muted-foreground text-xs">Clientas esperando reposición.</p>
		</Card.Content>
	</Card.Root>
</div>

<div class="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between gap-3">
				<Card.Title>Últimos pedidos</Card.Title>
				<Button href="/admin/pedidos" variant="ghost" size="sm">Ver todos</Button>
			</div>
		</Card.Header>

		<Card.Content>
			{#if data.recentOrders.length === 0}
				<p class="text-muted-foreground text-sm">Todavía no hay pedidos.</p>
			{:else}
				<ul class="divide-border divide-y">
					{#each data.recentOrders as order (order.id)}
						<li class="flex items-center justify-between gap-3 py-3">
							<div class="min-w-0">
								<a href="/admin/pedidos/{order.id}" class="text-sm font-medium">
									#{order.number} · {order.customer_name}
								</a>
								<p class="text-muted-foreground text-xs">
									{dateFormatter.format(new Date(order.created_at))}
								</p>
							</div>

							<div class="flex items-center gap-3">
								<span class="text-sm tabular-nums">{formatMoney(order.total)}</span>
								<Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
									{ORDER_STATUS_LABEL[order.status]}
								</Badge>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between gap-3">
				<Card.Title>Reponer pronto</Card.Title>
				<Button href="/admin/inventario" variant="ghost" size="sm">Inventario</Button>
			</div>
		</Card.Header>

		<Card.Content>
			{#if stats.lowStock.length === 0}
				<p class="text-muted-foreground text-sm">Nada por debajo del mínimo.</p>
			{:else}
				<ul class="divide-border divide-y">
					{#each stats.lowStock as item (item.id)}
						<li class="flex items-center justify-between gap-3 py-2.5 text-sm">
							<span class="min-w-0 truncate">
								{item.productName}
								<span class="text-muted-foreground text-xs">
									· {item.colorName} / {item.sizeLabel}
								</span>
							</span>
							<span class={item.stock === 0 ? 'text-destructive' : 'text-sale'}>
								{item.stock}
							</span>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
