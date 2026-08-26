<script lang="ts">
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();
</script>

<svelte:head>
	<title>Envíos — Panel</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Zonas de envío</h1>
	<p class="text-muted-foreground text-sm">
		La clienta elige una en el carrito y su costo entra en el total del pedido.
	</p>
</header>

{#if form?.error}
	<p class="text-destructive mb-4 text-sm">{form.error}</p>
{/if}

<section class="border-border bg-background mb-8 border p-6">
	<h2 class="mb-4 text-lg">Nueva zona</h2>

	<form method="POST" action="?/crear" class="grid gap-4 sm:grid-cols-4" use:enhance>
		<div class="space-y-2 sm:col-span-2">
			<Label for="name">Nombre</Label>
			<Input id="name" name="name" required placeholder="Bogotá" />
		</div>

		<div class="space-y-2">
			<Label for="cost">Costo</Label>
			<Input id="cost" name="cost" type="number" min="0" step="500" value="0" required />
		</div>

		<div class="space-y-2">
			<Label for="etaDays">Días de entrega</Label>
			<Input id="etaDays" name="etaDays" type="number" min="0" max="60" />
		</div>

		<div class="flex items-center gap-2 sm:col-span-4">
			<input id="active" name="active" type="checkbox" checked class="accent-primary size-4" />
			<Label for="active">Disponible en el carrito</Label>
		</div>

		<div class="sm:col-span-4">
			<Button type="submit">Crear zona</Button>
		</div>
	</form>
</section>

<div class="space-y-3">
	{#each data.zones as zone (zone.id)}
		<form
			method="POST"
			action="?/actualizar"
			class="border-border bg-background flex flex-wrap items-end gap-3 border p-4"
			use:enhance
		>
			<input type="hidden" name="id" value={zone.id} />
			<input type="hidden" name="sortOrder" value={zone.sort_order} />

			<div class="space-y-1">
				<Label class="text-xs" for="name-{zone.id}">Nombre</Label>
				<Input id="name-{zone.id}" name="name" value={zone.name} class="w-48" />
			</div>

			<div class="space-y-1">
				<Label class="text-xs" for="cost-{zone.id}">Costo</Label>
				<Input
					id="cost-{zone.id}"
					name="cost"
					type="number"
					min="0"
					step="500"
					value={zone.cost}
					class="w-32"
				/>
			</div>

			<div class="space-y-1">
				<Label class="text-xs" for="eta-{zone.id}">Días</Label>
				<Input
					id="eta-{zone.id}"
					name="etaDays"
					type="number"
					min="0"
					max="60"
					value={zone.eta_days ?? ''}
					class="w-24"
				/>
			</div>

			<label class="flex items-center gap-2 pb-2 text-xs">
				<input type="checkbox" name="active" checked={zone.active} class="accent-primary size-4" />
				Activa
			</label>

			<div class="ml-auto flex gap-2">
				<Button type="submit" size="sm" variant="outline">Guardar</Button>
			</div>
		</form>
	{/each}
</div>

<div class="mt-4 flex flex-wrap gap-2">
	{#each data.zones as zone (zone.id)}
		<form method="POST" action="?/eliminar" use:enhance>
			<input type="hidden" name="id" value={zone.id} />
			<Button type="submit" size="sm" variant="ghost" class="text-destructive">
				<Trash2 class="mr-1 size-3" />
				Borrar {zone.name}
			</Button>
		</form>
	{/each}
</div>
