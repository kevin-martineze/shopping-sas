<script lang="ts">
	import { untrack } from 'svelte';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import type { PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import * as Table from '$lib/components/atoms/table';
	import { ORDER_STATUSES, ORDER_STATUS_LABEL } from '$lib/domain/orders';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Valor inicial del buscador: la URL manda a partir de aquí.
	let search = $state(untrack(() => data.filters.q ?? ''));

	const dateFormatter = new Intl.DateTimeFormat('es-CO', {
		day: '2-digit',
		month: 'short',
		year: 'numeric'
	});

	function setStatus(status: string | null) {
		const url = new URL(page.url);

		if (status) url.searchParams.set('estado', status);
		else url.searchParams.delete('estado');

		url.searchParams.delete('pagina');
		goto(url, { keepFocus: true, noScroll: true });
	}

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();

		const url = new URL(page.url);
		const term = search.trim();

		if (term) url.searchParams.set('q', term);
		else url.searchParams.delete('q');

		url.searchParams.delete('pagina');
		goto(url, { keepFocus: true, noScroll: true });
	}

	function pageUrl(target: number): string {
		const url = new URL(page.url);
		url.searchParams.set('pagina', String(target));
		return `${url.pathname}${url.search}`;
	}
</script>

<svelte:head>
	<title>Pedidos — Panel</title>
</svelte:head>

<header class="mb-6 space-y-1">
	<h1 class="text-3xl">Pedidos</h1>
	<p class="text-muted-foreground text-sm">{data.total} en total.</p>
</header>

<div class="mb-4 flex flex-wrap items-center gap-2">
	<Button
		type="button"
		size="sm"
		variant={data.filters.status === null ? 'default' : 'outline'}
		onclick={() => setStatus(null)}
	>
		Todos
	</Button>

	{#each ORDER_STATUSES as status (status)}
		<Button
			type="button"
			size="sm"
			variant={data.filters.status === status ? 'default' : 'outline'}
			onclick={() => setStatus(status)}
		>
			{ORDER_STATUS_LABEL[status]}
		</Button>
	{/each}

	<form onsubmit={submitSearch} class="ml-auto flex gap-2">
		<Input bind:value={search} placeholder="Buscar #número o nombre" class="w-56" />
		<Button type="submit" variant="outline">Buscar</Button>
	</form>
</div>

{#if data.orders.length === 0}
	<p
		class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
	>
		No hay pedidos con ese filtro.
	</p>
{:else}
	<div class="border-border bg-background border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Pedido</Table.Head>
					<Table.Head>Clienta</Table.Head>
					<Table.Head>Fecha</Table.Head>
					<Table.Head>Estado</Table.Head>
					<Table.Head class="text-right">Total</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each data.orders as order (order.id)}
					<Table.Row>
						<Table.Cell>
							<a href="/admin/pedidos/{order.id}" class="font-medium">#{order.number}</a>
						</Table.Cell>
						<Table.Cell>
							<span class="block">{order.customer_name}</span>
							<span class="text-muted-foreground text-xs">{order.customer_phone}</span>
						</Table.Cell>
						<Table.Cell class="text-muted-foreground text-sm">
							{dateFormatter.format(new Date(order.created_at))}
						</Table.Cell>
						<Table.Cell>
							<Badge variant={order.status === 'cancelled' ? 'destructive' : 'secondary'}>
								{ORDER_STATUS_LABEL[order.status]}
							</Badge>
						</Table.Cell>
						<Table.Cell class="text-right tabular-nums">{formatMoney(order.total)}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	{#if data.pageCount > 1}
		<nav class="mt-6 flex justify-center gap-2">
			{#each Array.from({ length: data.pageCount }, (_, index) => index + 1) as target (target)}
				<a
					href={pageUrl(target)}
					class="border-border grid size-9 place-items-center border text-sm {target ===
					data.filters.page
						? 'bg-primary text-primary-foreground'
						: 'hover:bg-accent'}"
				>
					{target}
				</a>
			{/each}
		</nav>
	{/if}
{/if}
