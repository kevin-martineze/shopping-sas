<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	import { page } from '$app/state';

	import type { PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import SelectField from '$lib/components/molecules/SelectField.svelte';
	import {
		esperaDesde,
		SUPPORT_CATEGORY_LABEL,
		SUPPORT_STATUS_LABEL,
		type SupportStatus
	} from '$lib/domain/support';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const PAGE_PATH = '/plataforma/soporte';

	let estado = $state(untrack(() => data.filters.status ?? ''));
	let q = $state(untrack(() => data.filters.q ?? ''));

	const estadoOptions: { value: string; label: string }[] = [
		{ value: '', label: 'Todos los casos' },
		{ value: 'OPEN', label: SUPPORT_STATUS_LABEL.OPEN },
		{ value: 'ANSWERED', label: SUPPORT_STATUS_LABEL.ANSWERED },
		{ value: 'CLOSED', label: SUPPORT_STATUS_LABEL.CLOSED }
	];

	const totalPages = $derived(Math.max(1, Math.ceil(data.list.total / data.list.page_size)));

	/** Enlace a otra página conservando los filtros de la URL. */
	function pageHref(target: number): string {
		const params = new SvelteURLSearchParams(page.url.searchParams);

		if (target > 1) {
			params.set('pagina', String(target));
		} else {
			params.delete('pagina');
		}

		const query = params.toString();

		return query ? `${PAGE_PATH}?${query}` : PAGE_PATH;
	}

	function threadHref(storeId: string, ticketId: string): string {
		return `${PAGE_PATH}/${storeId}/${ticketId}`;
	}

	function statusLabel(status: SupportStatus): string {
		return SUPPORT_STATUS_LABEL[status];
	}
</script>

<svelte:head>
	<title>Soporte — Plataforma · Globerce</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Soporte</h1>
	<p class="text-muted-foreground text-sm">
		Lo que esperan las tiendas. Lo que lleva más tiempo sin respuesta sale primero.
	</p>
</header>

<form
	method="GET"
	class="border-border bg-card mb-6 grid gap-4 rounded-lg border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
>
	<div class="space-y-2">
		<Label for="estado">Estado</Label>
		<SelectField id="estado" name="estado" bind:value={estado} options={estadoOptions} />
	</div>

	<div class="space-y-2">
		<Label for="q">Buscar</Label>
		<Input id="q" name="q" bind:value={q} placeholder="Tienda, asunto o motivo" maxlength={100} />
	</div>

	<Button type="submit">Filtrar</Button>
</form>

{#if data.list.tickets.length === 0}
	<p
		class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
	>
		No hay casos con esos filtros.
	</p>
{:else}
	<div class="border-border bg-card overflow-hidden rounded-lg border">
		<Table.Root class="table-stack">
			<Table.Header>
				<Table.Row>
					<Table.Head>Tienda</Table.Head>
					<Table.Head>Asunto</Table.Head>
					<Table.Head>Motivo</Table.Head>
					<Table.Head>Estado</Table.Head>
					<Table.Head>Espera</Table.Head>
					<Table.Head>Sin leer</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each data.list.tickets as ticket (ticket.id)}
					<Table.Row>
						<Table.Cell data-label="Tienda">
							<span class="font-medium">{ticket.store_name}</span>
							<span class="text-muted-foreground block text-xs"
								>{ticket.opened_by_email ?? '—'}</span
							>
						</Table.Cell>

						<Table.Cell data-label="Asunto">
							<a href={threadHref(ticket.store_id, ticket.id)} class="hover:underline">
								{ticket.subject}
							</a>
						</Table.Cell>

						<Table.Cell data-label="Motivo" class="text-sm">
							{SUPPORT_CATEGORY_LABEL[ticket.category]}
						</Table.Cell>

						<Table.Cell data-label="Estado">
							<Badge variant={ticket.status === 'OPEN' ? 'default' : 'outline'}>
								{statusLabel(ticket.status)}
							</Badge>
						</Table.Cell>

						<Table.Cell data-label="Espera" class="text-muted-foreground text-sm">
							{ticket.waiting_since ? esperaDesde(ticket.waiting_since) : '—'}
						</Table.Cell>

						<Table.Cell data-label="Sin leer" class="tabular-nums">
							{ticket.unread_from_owner > 0 ? ticket.unread_from_owner : '—'}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<nav class="mt-4 flex items-center justify-between text-sm" aria-label="Páginas">
		<span class="text-muted-foreground">
			Página {data.filters.page} de {totalPages} · {data.list.total} casos
		</span>

		<div class="flex gap-2">
			{#if data.filters.page > 1}
				<a href={pageHref(data.filters.page - 1)} class="underline">Anterior</a>
			{/if}
			{#if data.filters.page < totalPages}
				<a href={pageHref(data.filters.page + 1)} class="underline">Siguiente</a>
			{/if}
		</div>
	</nav>
{/if}
