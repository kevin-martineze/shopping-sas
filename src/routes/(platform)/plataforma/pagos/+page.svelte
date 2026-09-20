<script lang="ts">
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	import type { PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import * as Table from '$lib/components/atoms/table';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const report = $derived(data.report);

	const monthFormatter = new Intl.DateTimeFormat('es-CO', {
		month: 'long',
		year: 'numeric',
		timeZone: 'UTC'
	});
	const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' });
	const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
		day: '2-digit',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit'
	});

	function formatDate(value: string): string {
		return dateFormatter.format(new Date(`${value}T00:00:00Z`));
	}

	/** `YYYY-MM` desplazado n meses. */
	function shiftMonth(month: string, delta: number): string {
		const [year, index] = month.split('-').map(Number);
		const date = new Date(Date.UTC(year ?? 0, (index ?? 1) - 1 + delta, 1));

		return date.toISOString().slice(0, 7);
	}

	const monthLabel = $derived.by(() => {
		const label = monthFormatter.format(new Date(`${report.month}-01T00:00:00Z`));

		return label.charAt(0).toUpperCase() + label.slice(1);
	});
</script>

<svelte:head>
	<title>Pagos — Plataforma Globerce</title>
</svelte:head>

<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
	<div class="space-y-1">
		<h1 class="text-3xl">Pagos</h1>
		<p class="text-muted-foreground text-sm">
			{report.payments.length}
			{report.payments.length === 1 ? 'pago' : 'pagos'} en {monthLabel}.
		</p>
	</div>

	<div class="flex items-center gap-2">
		<Button
			href={`/plataforma/pagos?mes=${shiftMonth(report.month, -1)}`}
			variant="outline"
			size="icon"
			aria-label="Mes anterior"
		>
			<ChevronLeft class="size-4" />
		</Button>
		<span class="min-w-40 text-center text-sm">{monthLabel}</span>
		<Button
			href={`/plataforma/pagos?mes=${shiftMonth(report.month, 1)}`}
			variant="outline"
			size="icon"
			aria-label="Mes siguiente"
		>
			<ChevronRight class="size-4" />
		</Button>
	</div>
</header>

<div class="border-border bg-background mb-6 border p-6">
	<p class="text-muted-foreground text-sm">Total cobrado</p>
	<p class="text-3xl font-semibold tabular-nums">{formatMoney(report.total)}</p>
</div>

{#if report.payments.length === 0}
	<p
		class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
	>
		No hay pagos registrados en este mes.
	</p>
{:else}
	<div class="border-border bg-background border">
		<Table.Root class="table-stack">
			<Table.Header>
				<Table.Row>
					<Table.Head>Tienda</Table.Head>
					<Table.Head>Período</Table.Head>
					<Table.Head>Medio</Table.Head>
					<Table.Head>Registrado</Table.Head>
					<Table.Head class="text-right">Monto</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each report.payments as payment (payment.id)}
					<Table.Row>
						<Table.Cell data-label="Tienda">
							<a
								href={`/plataforma/tiendas/${payment.store_id}`}
								class="font-medium hover:underline"
							>
								{payment.store_name}
							</a>
							<p class="text-muted-foreground text-xs">{payment.store_slug}</p>
						</Table.Cell>
						<Table.Cell data-label="Período">
							{formatDate(payment.period_start)} – {formatDate(payment.period_end)}
						</Table.Cell>
						<Table.Cell data-label="Medio">
							{payment.method}{payment.reference ? ` · ${payment.reference}` : ''}
						</Table.Cell>
						<Table.Cell data-label="Registrado" class="text-muted-foreground">
							{dateTimeFormatter.format(new Date(payment.created_at))}
							{#if payment.recorded_by}
								<span class="block text-xs">{payment.recorded_by}</span>
							{/if}
						</Table.Cell>
						<Table.Cell data-label="Monto" class="text-right tabular-nums">
							{formatMoney(payment.amount_cop)}
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/if}
