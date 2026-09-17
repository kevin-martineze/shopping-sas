<script lang="ts">
	import Search from '@lucide/svelte/icons/search';

	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Checkbox } from '$lib/components/atoms/checkbox';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import SelectField from '$lib/components/molecules/SelectField.svelte';
	import StoreStatusBadge from '$lib/components/molecules/StoreStatusBadge.svelte';
	import { STORE_STATUS_LABEL } from '$lib/domain/account';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	const statusOptions = [
		{ value: 'all', label: 'Todos los estados' },
		...Object.entries(STORE_STATUS_LABEL).map(([value, label]) => ({ value, label }))
	];

	const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' });

	function formatDate(value: string | null): string {
		return value ? dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : '—';
	}

	function applyFilter(name: string, value: string | null): void {
		const url = new URL(page.url);

		if (value) url.searchParams.set(name, value);
		else url.searchParams.delete(name);

		goto(url, { keepFocus: true, noScroll: true });
	}

	function planName(code: string | null): string {
		return data.plans.find((plan) => plan.code === code)?.name ?? code ?? '—';
	}
</script>

<svelte:head>
	<title>Tiendas — Plataforma</title>
</svelte:head>

<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="text-3xl">Tiendas</h1>
		<p class="text-muted-foreground text-sm">
			{data.stores.length}
			{data.stores.length === 1 ? 'tienda' : 'tiendas'} con este filtro.
		</p>
	</div>

	<form method="POST" action="?/vencimientos" use:enhance>
		<Button type="submit" variant="outline">Revisar vencimientos</Button>
	</form>
</header>

<FormFeedback
	error={form?.error ?? null}
	message={form && 'message' in form ? (form.message ?? null) : null}
/>

<section
	class="border-border bg-background mb-6 grid gap-3 border p-4 sm:grid-cols-[1fr_14rem_auto]"
>
	<form
		class="relative"
		onsubmit={(event) => {
			event.preventDefault();
			const value = new FormData(event.currentTarget).get('q');
			applyFilter('q', typeof value === 'string' && value.trim() ? value.trim() : null);
		}}
	>
		<Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
		<Input
			name="q"
			value={data.filters.q ?? ''}
			placeholder="Nombre, dirección o correo de la dueña"
			class="pl-9"
			aria-label="Buscar tiendas"
		/>
	</form>

	<SelectField
		name="estado"
		aria-label="Estado"
		value={data.filters.status ?? 'all'}
		options={statusOptions}
		onValueChange={(value) => applyFilter('estado', value === 'all' ? null : value)}
	/>

	<div class="flex items-center gap-2">
		<Checkbox
			id="vencidas"
			checked={data.filters.overdue}
			onCheckedChange={(checked) => applyFilter('vencidas', checked ? '1' : null)}
		/>
		<Label for="vencidas" class="whitespace-nowrap">Solo vencidas</Label>
	</div>
</section>

{#if data.stores.length === 0}
	<p
		class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
	>
		Ninguna tienda coincide.
	</p>
{:else}
	<div class="border-border bg-background border">
		<Table.Root class="table-stack">
			<Table.Header>
				<Table.Row>
					<Table.Head>Tienda</Table.Head>
					<Table.Head>Estado</Table.Head>
					<Table.Head>Plan</Table.Head>
					<Table.Head>Pago hasta</Table.Head>
					<Table.Head>Dueña</Table.Head>
					<Table.Head class="text-right">Prendas / pedidos</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each data.stores as store (store.id)}
					{@const owner = store.members.find((member) => member.role === 'owner')}
					<Table.Row>
						<Table.Cell data-label="Tienda">
							<a href={`/plataforma/tiendas/${store.id}`} class="font-medium hover:underline">
								{store.name}
							</a>
							<p class="text-muted-foreground text-xs">{store.slug}</p>
						</Table.Cell>
						<Table.Cell data-label="Estado"><StoreStatusBadge status={store.status} /></Table.Cell>
						<Table.Cell data-label="Plan">{planName(store.plan_code)}</Table.Cell>
						<Table.Cell data-label="Pago hasta">{formatDate(store.current_period_end)}</Table.Cell>
						<Table.Cell data-label="Dueña" class="max-w-48 truncate">
							{owner?.email ?? '—'}
						</Table.Cell>
						<Table.Cell data-label="Prendas / pedidos" class="text-right tabular-nums">
							{store.product_count} / {store.order_count}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/if}

<section class="mt-8">
	<h2 class="mb-3 text-lg">Planes</h2>
	<div class="grid gap-4 sm:grid-cols-2">
		{#each data.plans as plan (plan.code)}
			<div class="border-border bg-background border p-4 text-sm">
				<p class="font-medium">{plan.name} · {formatMoney(plan.price_cop)}/mes</p>
				<p class="text-muted-foreground">
					{plan.max_products ?? 'Sin límite de'} prendas ·
					{plan.max_orders_per_month ?? 'sin límite de'} pedidos/mes ·
					{plan.max_images_per_product ?? 'sin límite de'} fotos por prenda
					{plan.custom_domain ? '· dominio propio' : ''}
				</p>
			</div>
		{/each}
	</div>
</section>
