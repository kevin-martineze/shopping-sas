<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import * as Table from '$lib/components/atoms/table';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	const dashboard = $derived(data.dashboard);

	const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' });
	const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	});

	function formatDate(value: string | null): string {
		return value ? dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00Z`)) : '—';
	}

	function days(count: number): string {
		return count === 1 ? '1 día' : `${count} días`;
	}

	/** Cambio del mes contra el anterior, o null si no hay con qué comparar. */
	const revenueChange = $derived(
		dashboard.revenue_last_month > 0
			? Math.round(
					((dashboard.revenue_this_month - dashboard.revenue_last_month) /
						dashboard.revenue_last_month) *
						100
				)
			: null
	);
</script>

<svelte:head>
	<title>Resumen — Plataforma Globerce</title>
</svelte:head>

<header class="mb-8 flex flex-wrap items-end justify-between gap-4">
	<div class="space-y-1">
		<h1 class="text-3xl">Resumen</h1>
		<p class="text-muted-foreground text-sm">Cuánto entra, quién paga y quién está por vencer.</p>
	</div>

	<form method="POST" action="?/vencimientos" use:enhance>
		<Button type="submit" variant="outline">Revisar vencimientos</Button>
	</form>
</header>

<FormFeedback
	error={form?.error ?? null}
	message={form && 'message' in form ? (form.message ?? null) : null}
/>

<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Cobrado este mes</Card.Description>
			<Card.Title class="font-sans text-3xl tabular-nums">
				{formatMoney(dashboard.revenue_this_month)}
			</Card.Title>
		</Card.Header>
		<Card.Content class="text-muted-foreground text-xs">
			{#if revenueChange === null}
				Mes anterior: {formatMoney(dashboard.revenue_last_month)}.
			{:else}
				{revenueChange >= 0 ? '+' : ''}{revenueChange}% frente a {formatMoney(
					dashboard.revenue_last_month
				)} el mes anterior.
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Ingreso mensual recurrente</Card.Description>
			<Card.Title class="font-sans text-3xl tabular-nums">{formatMoney(dashboard.mrr)}</Card.Title>
		</Card.Header>
		<Card.Content class="text-muted-foreground text-xs">
			Suma del plan de las tiendas que pagan y siguen activas.
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Tiendas que pagan</Card.Description>
			<Card.Title class="font-sans text-3xl tabular-nums">{dashboard.paying_stores}</Card.Title>
		</Card.Header>
		<Card.Content class="text-muted-foreground text-xs">
			De {dashboard.stores.total} en total · {dashboard.stores.trial} en prueba ·
			{dashboard.stores.suspended} suspendidas.
		</Card.Content>
	</Card.Root>

	<Card.Root>
		<Card.Header class="pb-2">
			<Card.Description>Vencidas</Card.Description>
			<Card.Title class="font-sans text-3xl tabular-nums">{dashboard.stores.past_due}</Card.Title>
		</Card.Header>
		<Card.Content class="text-muted-foreground text-xs">
			Siguen vendiendo, pero no han pagado el período.
		</Card.Content>
	</Card.Root>
</div>

<div class="mt-8 grid gap-6 lg:grid-cols-2">
	<section class="border-border bg-card overflow-hidden rounded-lg border">
		<header class="border-border flex items-center justify-between border-b px-4 py-3">
			<h2 class="text-lg">Por cobrar</h2>
			<a href="/plataforma/tiendas?vencidas=1" class="text-muted-foreground text-xs underline">
				Ver vencidas
			</a>
		</header>

		{#if dashboard.overdue.length === 0 && dashboard.trials_ending.length === 0}
			<p class="text-muted-foreground px-4 py-8 text-center text-sm">
				Nadie por vencer esta semana.
			</p>
		{:else}
			<ul class="divide-border divide-y">
				{#each dashboard.overdue as store (store.id)}
					<li class="flex items-center justify-between gap-4 px-4 py-3 text-sm">
						<div class="min-w-0">
							<a href={`/plataforma/tiendas/${store.id}`} class="font-medium hover:underline">
								{store.name}
							</a>
							<p class="text-muted-foreground truncate text-xs">
								{store.owner_email ?? store.slug}
							</p>
						</div>
						<span class="text-destructive whitespace-nowrap">
							Vencida hace {days(store.days_overdue)}
						</span>
					</li>
				{/each}

				{#each dashboard.trials_ending as store (store.id)}
					<li class="flex items-center justify-between gap-4 px-4 py-3 text-sm">
						<div class="min-w-0">
							<a href={`/plataforma/tiendas/${store.id}`} class="font-medium hover:underline">
								{store.name}
							</a>
							<p class="text-muted-foreground truncate text-xs">
								{store.owner_email ?? store.slug}
							</p>
						</div>
						<span class="text-muted-foreground whitespace-nowrap">
							{store.days_left < 0
								? 'Prueba terminada'
								: store.days_left === 0
									? 'La prueba termina hoy'
									: `Prueba termina en ${days(store.days_left)}`}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</section>

	<section class="border-border bg-card overflow-hidden rounded-lg border">
		<header class="border-border flex items-center justify-between border-b px-4 py-3">
			<h2 class="text-lg">Últimos pagos</h2>
			<a href="/plataforma/pagos" class="text-muted-foreground text-xs underline">Ver por mes</a>
		</header>

		{#if dashboard.recent_payments.length === 0}
			<p class="text-muted-foreground px-4 py-8 text-center text-sm">Todavía no hay pagos.</p>
		{:else}
			<Table.Root>
				<Table.Body>
					{#each dashboard.recent_payments as payment (payment.id)}
						<Table.Row>
							<Table.Cell>
								<a
									href={`/plataforma/tiendas/${payment.store_id}`}
									class="font-medium hover:underline"
								>
									{payment.store_name}
								</a>
								<p class="text-muted-foreground text-xs">
									{formatDate(payment.period_start)} – {formatDate(payment.period_end)} · {payment.method}
								</p>
							</Table.Cell>
							<Table.Cell class="text-right tabular-nums">
								{formatMoney(payment.amount_cop)}
								<p class="text-muted-foreground text-xs">
									{dateTimeFormatter.format(new Date(payment.created_at))}
								</p>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</section>
</div>
