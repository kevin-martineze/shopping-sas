<script lang="ts">
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import NumberField from '$lib/components/molecules/NumberField.svelte';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();
</script>

<svelte:head>
	<title>Envíos — Panel</title>
</svelte:head>

<header class="mb-6 space-y-1">
	<h1 class="text-3xl">Zonas de envío</h1>
	<p class="text-muted-foreground text-sm">
		La clienta elige una en el carrito y su costo entra en el total del pedido.
	</p>
</header>

<FormFeedback error={form?.error ?? null} />

<Card.Root>
	<Card.Header>
		<Card.Title>Zonas</Card.Title>
		<Card.Description>{data.zones.length} configuradas</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-4">
		<form
			method="POST"
			action="?/crear"
			class="bg-muted/50 flex flex-wrap items-end gap-3 rounded-lg p-4"
			use:enhance
		>
			<div class="space-y-1.5">
				<Label class="text-xs" for="name">Nombre</Label>
				<Input id="name" name="name" required placeholder="Bogotá" class="w-56" />
			</div>

			<div class="space-y-1.5">
				<Label class="text-xs" for="cost">Costo</Label>
				<NumberField id="cost" name="cost" value={0} step={500} max={9999999} class="w-40" />
			</div>

			<div class="space-y-1.5">
				<Label class="text-xs" for="etaDays">Días</Label>
				<NumberField id="etaDays" name="etaDays" value={2} max={60} class="w-32" />
			</div>

			<div class="pb-2">
				<CheckboxField id="nueva-zona" name="active" label="Disponible" checked />
			</div>

			<Button type="submit" size="sm">Agregar zona</Button>
		</form>

		<Table.Root class="table-stack">
			<Table.Header>
				<Table.Row>
					<Table.Head>Zona</Table.Head>
					<Table.Head class="w-44">Costo</Table.Head>
					<Table.Head class="w-36">Días</Table.Head>
					<Table.Head class="w-32">Disponible</Table.Head>
					<Table.Head class="w-36">En la tienda</Table.Head>
					<Table.Head class="w-32"></Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each data.zones as zone (`${zone.id}:${zone.active}`)}
					<Table.Row>
						<Table.Cell data-label="Zona">
							<Input form="zona-{zone.id}" name="name" value={zone.name} aria-label="Nombre" />
						</Table.Cell>

						<Table.Cell data-label="Costo">
							<NumberField
								form="zona-{zone.id}"
								name="cost"
								value={zone.cost}
								step={500}
								max={9999999}
								aria-label="Costo"
							/>
						</Table.Cell>

						<Table.Cell data-label="Días">
							<NumberField
								form="zona-{zone.id}"
								name="etaDays"
								value={zone.eta_days ?? 0}
								max={60}
								aria-label="Días de entrega"
							/>
						</Table.Cell>

						<Table.Cell data-label="Disponible">
							<CheckboxField
								id="zona-activa-{zone.id}"
								form="zona-{zone.id}"
								name="active"
								label="Disponible"
								checked={zone.active}
							/>
						</Table.Cell>

						<Table.Cell data-label="En la tienda" class="text-muted-foreground text-xs">
							{zone.cost === 0 ? 'Gratis' : formatMoney(zone.cost)}
							{zone.eta_days ? ` · ${zone.eta_days} días` : ''}
						</Table.Cell>

						<Table.Cell data-label="">
							<div class="flex items-center gap-1">
								<Button type="submit" form="zona-{zone.id}" size="sm" variant="outline">
									Guardar
								</Button>

								<Button
									type="submit"
									form="borrar-zona-{zone.id}"
									size="sm"
									variant="ghost"
									class="text-destructive"
									aria-label="Borrar {zone.name}"
								>
									<Trash2 class="size-3" />
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</Card.Content>
</Card.Root>

<!-- El HTML no admite <form> dentro de <tbody>: viven aquí y se referencian por id. -->
<div hidden>
	{#each data.zones as zone (zone.id)}
		<form id="zona-{zone.id}" method="POST" action="?/actualizar" use:enhance>
			<input type="hidden" name="id" value={zone.id} />
			<input type="hidden" name="sortOrder" value={zone.sort_order} />
		</form>

		<form id="borrar-zona-{zone.id}" method="POST" action="?/eliminar" use:enhance>
			<input type="hidden" name="id" value={zone.id} />
		</form>
	{/each}
</div>
