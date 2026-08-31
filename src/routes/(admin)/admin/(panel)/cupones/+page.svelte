<script lang="ts">
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import SelectField from '$lib/components/molecules/SelectField.svelte';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let type = $state<'percent' | 'fixed'>('percent');

	const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });
</script>

<svelte:head>
	<title>Cupones — Panel</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Cupones</h1>
	<p class="text-muted-foreground text-sm">
		El código se valida en el carrito y el descuento lo recalcula el servidor.
	</p>
</header>

<FormFeedback error={form?.error ?? null} />

<section class="border-border bg-background mb-8 border p-6">
	<h2 class="mb-4 text-lg">Nuevo cupón</h2>

	<form method="POST" action="?/crear" class="grid gap-4 sm:grid-cols-3" use:enhance>
		<div class="space-y-2">
			<Label for="code">Código</Label>
			<Input id="code" name="code" required placeholder="BIENVENIDA10" class="uppercase" />
		</div>

		<div class="space-y-2">
			<Label for="type">Tipo</Label>
			<SelectField
				id="type"
				name="type"
				bind:value={type}
				options={[
					{ value: 'percent', label: 'Porcentaje' },
					{ value: 'fixed', label: 'Monto fijo' }
				]}
			/>
		</div>

		<div class="space-y-2">
			<Label for="value">{type === 'percent' ? 'Porcentaje (1-100)' : 'Monto en pesos'}</Label>
			<Input
				id="value"
				name="value"
				type="number"
				min="1"
				max={type === 'percent' ? 100 : undefined}
				required
			/>
		</div>

		<div class="space-y-2">
			<Label for="minSubtotal">Mínimo de compra</Label>
			<Input id="minSubtotal" name="minSubtotal" type="number" min="0" step="1000" value="0" />
		</div>

		<div class="space-y-2">
			<Label for="maxUses">Usos máximos</Label>
			<Input id="maxUses" name="maxUses" type="number" min="1" placeholder="Sin límite" />
		</div>

		<div class="space-y-2">
			<Label for="endsAt">Vence el</Label>
			<Input id="endsAt" name="endsAt" type="date" />
		</div>

		<div class="sm:col-span-3">
			<CheckboxField id="active" name="active" label="Activo desde ya" checked />
		</div>

		<div class="sm:col-span-3">
			<Button type="submit">Crear cupón</Button>
		</div>
	</form>
</section>

{#if data.coupons.length === 0}
	<p
		class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
	>
		Todavía no hay cupones.
	</p>
{:else}
	<div class="border-border bg-background border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Código</Table.Head>
					<Table.Head>Descuento</Table.Head>
					<Table.Head>Mínimo</Table.Head>
					<Table.Head>Usos</Table.Head>
					<Table.Head>Vence</Table.Head>
					<Table.Head></Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each data.coupons as coupon (coupon.id)}
					<Table.Row>
						<Table.Cell>
							<span class="font-medium">{coupon.code}</span>
							{#if !coupon.active}
								<Badge variant="outline" class="ml-2">Inactivo</Badge>
							{/if}
						</Table.Cell>

						<Table.Cell>
							{coupon.type === 'percent' ? `${coupon.value}%` : formatMoney(coupon.value)}
						</Table.Cell>

						<Table.Cell class="tabular-nums">
							{coupon.min_subtotal > 0 ? formatMoney(coupon.min_subtotal) : '—'}
						</Table.Cell>

						<Table.Cell class="tabular-nums">
							{coupon.uses}{coupon.max_uses ? ` / ${coupon.max_uses}` : ''}
						</Table.Cell>

						<Table.Cell class="text-muted-foreground text-sm">
							{coupon.ends_at ? dateFormatter.format(new Date(coupon.ends_at)) : '—'}
						</Table.Cell>

						<Table.Cell class="text-right">
							<div class="flex justify-end gap-1">
								<form method="POST" action="?/alternar" use:enhance>
									<input type="hidden" name="id" value={coupon.id} />
									<input type="hidden" name="active" value={String(!coupon.active)} />
									<Button type="submit" size="sm" variant="ghost">
										{coupon.active ? 'Desactivar' : 'Activar'}
									</Button>
								</form>

								<form method="POST" action="?/eliminar" use:enhance>
									<input type="hidden" name="id" value={coupon.id} />
									<Button type="submit" size="sm" variant="ghost" class="text-destructive">
										<Trash2 class="size-3" />
									</Button>
								</form>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/if}
