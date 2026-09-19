<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import * as Table from '$lib/components/atoms/table';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import UsageMeter from '$lib/components/molecules/UsageMeter.svelte';
	import { planFeatures, STORE_STATUS_LABEL } from '$lib/domain/account';
	import { cn } from '$lib/utils';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state('');

	const subscription = $derived(data.subscription);
	const plan = $derived(subscription.plan);

	/** Cobrarse sola es de la dueña, y solo mientras la tienda no esté suspendida. */
	const puedePagar = $derived(
		data.canPay && subscription.self_service_billing && subscription.store_status !== 'suspended'
	);

	/** Los demás planes: cambiar de plan es pagar el nuevo. */
	const otros = $derived(data.plans.filter((otro) => otro.code !== plan.code));

	const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' });
	const shortDate = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeZone: 'UTC' });

	function fecha(day: string): string {
		return dateFormatter.format(new Date(`${day}T00:00:00Z`));
	}

	const periodEnd = $derived(fecha(subscription.current_period_end));
</script>

<svelte:head>
	<title>Plan — Globerce</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Tu plan</h1>
	<p class="text-muted-foreground text-sm">
		Qué incluye, cuánto llevas usado y hasta cuándo está pago.
	</p>
</header>

<!-- Solo errores: cuando el cobro sale bien, esta página ya no está —se fue a
     la pasarela— y quien confirma es su evento. -->
<FormFeedback error={form?.error ?? null} message={null} />

<div class="grid gap-6 lg:grid-cols-3">
	<section
		class={cn(
			'border-border bg-background space-y-4 rounded-lg border p-6 lg:col-span-1',
			plan.ai_replies_per_month > 0 && 'ai-aurora border-transparent'
		)}
	>
		<div class="flex items-center justify-between gap-2">
			<h2 class="text-2xl">{plan.name}</h2>
			<Badge variant={subscription.store_status === 'active' ? 'default' : 'secondary'}>
				{STORE_STATUS_LABEL[subscription.store_status]}
			</Badge>
		</div>

		<p class="text-3xl font-semibold">
			{formatMoney(plan.price_cop)}<span class="text-muted-foreground text-sm font-normal">
				/ mes</span
			>
		</p>

		<dl class="space-y-2 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">
					{subscription.store_status === 'trial' ? 'La prueba termina' : 'Pago hasta'}
				</dt>
				<dd>{periodEnd}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">Días restantes</dt>
				<dd>{Math.max(0, subscription.days_left)}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">Dominio propio</dt>
				<dd>{plan.custom_domain ? 'Incluido' : 'No incluido'}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">Asistente</dt>
				<dd class="flex items-center gap-1.5">
					{#if plan.ai_replies_per_month > 0}
						<Sparkles class="size-3.5" />
						{plan.ai_replies_per_month.toLocaleString('es-CO')} respuestas/mes
					{:else}
						No incluido
					{/if}
				</dd>
			</div>
		</dl>

		{#if puedePagar}
			<form
				method="POST"
				action="?/pagar"
				class="border-border space-y-2 border-t pt-4"
				use:enhance={() => {
					submitting = plan.code;

					return async ({ update }) => {
						await update();
						submitting = '';
					};
				}}
			>
				<input type="hidden" name="planCode" value={plan.code} />
				<Button type="submit" class="w-full" disabled={submitting !== ''}>
					{submitting === plan.code ? 'Llevándote a pagar…' : `Pagar un mes de ${plan.name}`}
				</Button>
				<p class="text-muted-foreground text-xs">
					Te llevamos a la pasarela. El mes nuevo suma desde que termina el período actual, y el
					plan queda al día cuando el pago se confirma.
				</p>
			</form>
		{:else}
			<p class="text-muted-foreground border-border border-t pt-4 text-xs">
				{#if !data.canPay}
					Solo las dueñas de la tienda pueden cambiar o pagar el plan.
				{:else if subscription.store_status === 'suspended'}
					Tu tienda está suspendida: escríbenos por WhatsApp para reactivarla.
				{:else}
					Los pagos se registran a mano por ahora. Para pagar o cambiar de plan, escríbenos por
					WhatsApp con el nombre de tu tienda.
				{/if}
			</p>
		{/if}
	</section>

	<section class="border-border bg-background space-y-6 border p-6 lg:col-span-2">
		<h2 class="text-lg">Uso</h2>

		<UsageMeter
			label="Prendas"
			used={subscription.usage.products}
			limit={plan.max_products}
			hint="Las archivadas también cuentan."
		/>

		<UsageMeter
			label="Pedidos de este mes"
			used={subscription.usage.orders_this_month}
			limit={plan.max_orders_per_month}
			hint="Se reinicia el día 1, hora de Colombia."
		/>

		<div class="text-sm">
			<p>Fotos por prenda</p>
			<p class="text-muted-foreground">
				{plan.max_images_per_product === null
					? 'Sin límite'
					: `Hasta ${plan.max_images_per_product} por prenda`}
			</p>
		</div>

		<p class="text-muted-foreground text-xs">
			Al llegar a un límite no se borra nada: solo no puedes crear más hasta cambiar de plan.
		</p>
	</section>
</div>

{#if puedePagar && otros.length > 0}
	<section class="mt-8">
		<h2 class="mb-1 text-lg">Cambiar de plan</h2>
		<p class="text-muted-foreground mb-4 text-sm">
			El plan nuevo empieza al pagarlo y el mes corre desde que termina el que tienes.
		</p>

		<div class="grid gap-4 md:grid-cols-2">
			{#each otros as otro (otro.code)}
				<div
					class={cn(
						'border-border bg-background flex flex-col rounded-lg border p-6',
						otro.ai_replies_per_month > 0 && 'ai-aurora border-transparent'
					)}
				>
					<div class="flex items-baseline justify-between gap-3">
						<h3 class="flex items-center gap-2 text-xl">
							{otro.name}
							{#if otro.ai_replies_per_month > 0}
								<Sparkles class="size-4" />
							{/if}
						</h3>
						<p class="font-semibold">
							{formatMoney(otro.price_cop)}<span class="text-muted-foreground text-xs font-normal">
								/ mes</span
							>
						</p>
					</div>

					<ul class="mt-4 space-y-2 text-sm">
						{#each planFeatures(otro) as caracteristica (caracteristica)}
							<li class="flex items-start gap-2">
								<Check class="text-muted-foreground mt-0.5 size-4 flex-none" />
								<span>{caracteristica}</span>
							</li>
						{/each}
					</ul>

					<form
						method="POST"
						action="?/pagar"
						class="mt-6"
						use:enhance={() => {
							submitting = otro.code;

							return async ({ update }) => {
								await update();
								submitting = '';
							};
						}}
					>
						<input type="hidden" name="planCode" value={otro.code} />
						<Button
							type="submit"
							variant={otro.price_cop > plan.price_cop ? 'default' : 'outline'}
							class="w-full"
							disabled={submitting !== ''}
						>
							{submitting === otro.code ? 'Llevándote a pagar…' : `Pasarme a ${otro.name}`}
						</Button>
					</form>
				</div>
			{/each}
		</div>
	</section>
{/if}

{#if subscription.payments.length > 0}
	<section class="border-border bg-background mt-8 border p-6">
		<h2 class="mb-4 text-lg">Tus pagos</h2>

		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Fecha</Table.Head>
					<Table.Head>Período</Table.Head>
					<Table.Head>Medio</Table.Head>
					<Table.Head class="text-right">Valor</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each subscription.payments as pago (pago.id)}
					<Table.Row>
						<Table.Cell>{shortDate.format(new Date(pago.created_at))}</Table.Cell>
						<Table.Cell class="text-muted-foreground">
							{shortDate.format(new Date(`${pago.period_start}T00:00:00Z`))} —
							{shortDate.format(new Date(`${pago.period_end}T00:00:00Z`))}
						</Table.Cell>
						<Table.Cell class={cn(pago.method === 'simulado' && 'text-muted-foreground')}>
							{pago.method === 'simulado' ? 'Pago de prueba' : pago.method}
						</Table.Cell>
						<Table.Cell class="text-right tabular-nums">{formatMoney(pago.amount_cop)}</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</section>
{/if}
