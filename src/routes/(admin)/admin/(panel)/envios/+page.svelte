<script lang="ts">
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import type { StorefrontDraft } from '$lib/domain/preview';
	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import NumberField from '$lib/components/molecules/NumberField.svelte';
	import LivePreviewLayout from '$lib/components/organisms/LivePreviewLayout.svelte';
	import { themePreviewUrl } from '$lib/template-preview';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	interface ZoneEdit {
		name?: string;
		cost?: number;
		etaDays?: number;
		active?: boolean;
	}

	/**
	 * Los cambios de cada fila viven aquí, por id. Así la tabla sigue pintando
	 * lo guardado y el borrador se arma con lo que la dueña escribe encima.
	 */
	let zoneEdits = $state<Record<string, ZoneEdit>>({});

	// La zona que se está creando también se ve, sin esperar a guardarla.
	let newName = $state('');
	let newCost = $state(0);
	let newEtaDays = $state(2);
	let newActive = $state(true);

	const rows = $derived(
		data.zones.map((zone) => ({
			id: zone.id,
			name: zoneEdits[zone.id]?.name ?? zone.name,
			cost: zoneEdits[zone.id]?.cost ?? zone.cost,
			etaDays: zoneEdits[zone.id]?.etaDays ?? zone.eta_days,
			active: zoneEdits[zone.id]?.active ?? zone.active,
			sortOrder: zone.sort_order
		}))
	);

	const draftZones = $derived([
		...rows.map((zone) => ({
			id: zone.id,
			name: zone.name,
			// Un campo vacío llega como NaN: el borrador prefiere cero a romperse.
			cost: Number.isFinite(zone.cost) ? zone.cost : 0,
			etaDays: zone.etaDays,
			active: zone.active
		})),
		...(newName.trim()
			? [
					{
						id: 'nueva',
						name: newName,
						cost: Number.isFinite(newCost) ? newCost : 0,
						etaDays: Number.isFinite(newEtaDays) ? newEtaDays : null,
						active: newActive
					}
				]
			: [])
	]);

	const draft = $derived<StorefrontDraft>({
		template: data.settings.template,
		theme: data.settings.theme,
		content: { kind: 'shipping', zones: draftZones },
		focus: 'prodhipping'
	});

	const previewSrc = $derived(
		themePreviewUrl(
			new URL('/vista-previa/carrito', data.previewUrl).toString(),
			data.settings.template,
			data.settings.theme
		)
	);

	function editZone(id: string, patch: ZoneEdit) {
		zoneEdits[id] = { ...zoneEdits[id], ...patch };
	}
</script>

<svelte:head>
	<title>Envíos — Globerce</title>
</svelte:head>

<header class="mb-6 space-y-1">
	<h1 class="text-3xl">Zonas de envío</h1>
	<p class="text-muted-foreground text-sm">
		El cliente elige una en el carrito y su costo entra en el total del pedido.
	</p>
</header>

<FormFeedback error={form?.error ?? null} />

<LivePreviewLayout src={previewSrc} {draft} title="Así se ve tu envío">
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
				use:enhance={() => {
					return async ({ result, update }) => {
						await update();
						if (result.type === 'success') {
							newName = '';
							newCost = 0;
							newEtaDays = 2;
							newActive = true;
						}
					};
				}}
			>
				<div class="space-y-1.5">
					<Label class="text-xs" for="name">Nombre</Label>
					<Input
						id="name"
						name="name"
						required
						placeholder="Bogotá"
						class="w-56"
						bind:value={newName}
					/>
				</div>

				<div class="space-y-1.5">
					<Label class="text-xs" for="cost">Costo</Label>
					<NumberField
						id="cost"
						name="cost"
						bind:value={newCost}
						step={500}
						max={9999999}
						class="w-40"
					/>
				</div>

				<div class="space-y-1.5">
					<Label class="text-xs" for="etaDays">Días</Label>
					<NumberField id="etaDays" name="etaDays" bind:value={newEtaDays} max={60} class="w-32" />
				</div>

				<div class="pb-2">
					<CheckboxField
						id="nueva-zona"
						name="active"
						label="Disponible"
						bind:checked={newActive}
					/>
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
					{#each rows as zone (zone.id)}
						<Table.Row>
							<Table.Cell data-label="Zona">
								<Input
									form="zona-{zone.id}"
									name="name"
									value={zone.name}
									oninput={(event) => editZone(zone.id, { name: event.currentTarget.value })}
									aria-label="Nombre"
								/>
							</Table.Cell>

							<Table.Cell data-label="Costo">
								<NumberField
									form="zona-{zone.id}"
									name="cost"
									value={zone.cost}
									onchange={(value) => editZone(zone.id, { cost: value })}
									step={500}
									max={9999999}
									aria-label="Costo"
								/>
							</Table.Cell>

							<Table.Cell data-label="Días">
								<NumberField
									form="zona-{zone.id}"
									name="etaDays"
									value={zone.etaDays ?? 0}
									onchange={(value) => editZone(zone.id, { etaDays: value })}
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
									onchange={(checked) => editZone(zone.id, { active: checked })}
								/>
							</Table.Cell>

							<Table.Cell data-label="En la tienda" class="text-muted-foreground text-xs">
								{zone.cost === 0 ? 'Gratis' : formatMoney(zone.cost)}
								{zone.etaDays ? ` · ${zone.etaDays} días` : ''}
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
</LivePreviewLayout>

<!-- El HTML no admite <form> dentro de <tbody>: viven aquí y se referencian por id. -->
<div hidden>
	{#each data.zones as zone (zone.id)}
		<form
			id="zona-{zone.id}"
			method="POST"
			action="?/actualizar"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						delete zoneEdits[zone.id];
					}
				};
			}}
		>
			<input type="hidden" name="id" value={zone.id} />
			<input type="hidden" name="sortOrder" value={zone.sort_order} />
		</form>

		<form
			id="borrar-zona-{zone.id}"
			method="POST"
			action="?/eliminar"
			use:enhance={() => {
				return async ({ result, update }) => {
					await update();
					if (result.type === 'success') {
						delete zoneEdits[zone.id];
					}
				};
			}}
		>
			<input type="hidden" name="id" value={zone.id} />
		</form>
	{/each}
</div>
