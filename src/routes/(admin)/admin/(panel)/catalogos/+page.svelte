<script lang="ts">
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
	import ColorField from '$lib/components/molecules/ColorField.svelte';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import NumberField from '$lib/components/molecules/NumberField.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	const message = $derived(form && 'message' in form ? form.message : null);
	const error = $derived(form && 'error' in form ? form.error : null);

	/** El siguiente lugar libre, para que dos filas no compartan orden. */
	function nextOrder(rows: { sort_order: number }[]): number {
		return rows.reduce((max, row) => Math.max(max, row.sort_order), 0) + 1;
	}

	function usoColor(id: string): number {
		return data.usage.colors[id] ?? 0;
	}

	function usoTalla(id: string): number {
		return data.usage.sizes[id] ?? 0;
	}

	function usoCategoria(id: string): number {
		return data.usage.categories[id] ?? 0;
	}
</script>

<svelte:head>
	<title>Catálogos — Panel</title>
</svelte:head>

<header class="mb-6 space-y-1">
	<h1 class="text-3xl">Catálogos</h1>
	<p class="text-muted-foreground text-sm">
		Los colores, tallas y categorías que puedes usar en tus prendas. Lo que ya esté en uso no se
		borra: se oculta, y los pedidos viejos lo siguen mostrando.
	</p>
</header>

<FormFeedback {error} {message} />

<div class="space-y-8">
	<Card.Root>
		<Card.Header>
			<div class="flex items-center justify-between gap-3">
				<div>
					<Card.Title>Colores</Card.Title>
					<Card.Description>{data.colors.length} en el catálogo</Card.Description>
				</div>
			</div>
		</Card.Header>

		<Card.Content class="space-y-4">
			<form
				method="POST"
				action="?/crearColor"
				class="bg-muted/50 flex flex-wrap items-end gap-3 rounded-lg p-4"
				use:enhance
			>
				<div class="space-y-1.5">
					<Label class="text-xs" for="color-hex">Tono</Label>
					<ColorField id="color-hex" name="hex" />
				</div>

				<div class="space-y-1.5">
					<Label class="text-xs" for="color-name">Nombre</Label>
					<Input id="color-name" name="name" required placeholder="Verde menta" class="w-52" />
				</div>

				<div class="space-y-1.5">
					<Label class="text-xs" for="color-order">Orden</Label>
					<NumberField
						id="color-order"
						name="sortOrder"
						value={nextOrder(data.colors)}
						class="w-32"
					/>
				</div>

				<div class="pb-2">
					<CheckboxField id="nuevo-color" name="active" label="Visible" checked />
				</div>

				<Button type="submit" size="sm">Agregar color</Button>
			</form>

			<Table.Root class="table-stack">
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-32">Tono</Table.Head>
						<Table.Head>Nombre</Table.Head>
						<Table.Head class="w-36">Orden</Table.Head>
						<Table.Head class="w-28">Visible</Table.Head>
						<Table.Head class="w-32">Uso</Table.Head>
						<Table.Head class="w-32"></Table.Head>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{#each data.colors as color (`${color.id}:${color.active}`)}
						{@const enUso = usoColor(color.id)}
						<Table.Row>
							<Table.Cell data-label="Tono">
								<ColorField
									id="tono-{color.id}"
									name="hex"
									form="color-{color.id}"
									value={color.hex}
								/>
							</Table.Cell>

							<Table.Cell data-label="Nombre">
								<Input
									form="color-{color.id}"
									name="name"
									value={color.name}
									aria-label="Nombre del color"
								/>
							</Table.Cell>

							<Table.Cell data-label="Orden">
								<NumberField
									form="color-{color.id}"
									name="sortOrder"
									value={color.sort_order}
									aria-label="Orden"
								/>
							</Table.Cell>

							<Table.Cell data-label="Visible">
								<CheckboxField
									id="color-visible-{color.id}"
									form="color-{color.id}"
									name="active"
									label="Visible"
									checked={color.active}
								/>
							</Table.Cell>

							<Table.Cell data-label="Uso" class="text-muted-foreground text-xs">
								{#if !color.active}
									<Badge variant="outline">
										<EyeOff class="mr-1 size-3" />
										Oculto
									</Badge>
								{:else if enUso > 0}
									{enUso} variantes
								{:else}
									sin usar
								{/if}
							</Table.Cell>

							<Table.Cell data-label="">
								<div class="flex items-center gap-1">
									<Button type="submit" form="color-{color.id}" size="sm" variant="outline">
										Guardar
									</Button>

									<Button
										type="submit"
										form="borrar-color-{color.id}"
										size="sm"
										variant="ghost"
										class="text-destructive"
										title={enUso > 0 ? 'Está en uso: se ocultará' : 'Borrar'}
										aria-label="Borrar {color.name}"
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

	<Card.Root>
		<Card.Header>
			<Card.Title>Tallas</Card.Title>
			<Card.Description>El orden manda sobre el alfabético: así XL queda tras L.</Card.Description>
		</Card.Header>

		<Card.Content class="space-y-4">
			<form
				method="POST"
				action="?/crearTalla"
				class="bg-muted/50 flex flex-wrap items-end gap-3 rounded-lg p-4"
				use:enhance
			>
				<div class="space-y-1.5">
					<Label class="text-xs" for="size-label">Talla</Label>
					<Input id="size-label" name="label" required placeholder="XXL" class="w-28 uppercase" />
				</div>

				<div class="space-y-1.5">
					<Label class="text-xs" for="size-order">Orden</Label>
					<NumberField
						id="size-order"
						name="sortOrder"
						value={nextOrder(data.sizes)}
						class="w-32"
					/>
				</div>

				<div class="pb-2">
					<CheckboxField id="nueva-talla" name="active" label="Visible" checked />
				</div>

				<Button type="submit" size="sm">Agregar talla</Button>
			</form>

			<Table.Root class="table-stack">
				<Table.Header>
					<Table.Row>
						<Table.Head>Talla</Table.Head>
						<Table.Head class="w-36">Orden</Table.Head>
						<Table.Head class="w-28">Visible</Table.Head>
						<Table.Head class="w-32">Uso</Table.Head>
						<Table.Head class="w-32"></Table.Head>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{#each data.sizes as size (`${size.id}:${size.active}`)}
						{@const enUso = usoTalla(size.id)}
						<Table.Row>
							<Table.Cell data-label="Talla">
								<Input
									form="talla-{size.id}"
									name="label"
									value={size.label}
									class="uppercase"
									aria-label="Talla"
								/>
							</Table.Cell>

							<Table.Cell data-label="Orden">
								<NumberField
									form="talla-{size.id}"
									name="sortOrder"
									value={size.sort_order}
									aria-label="Orden"
								/>
							</Table.Cell>

							<Table.Cell data-label="Visible">
								<CheckboxField
									id="size-visible-{size.id}"
									form="talla-{size.id}"
									name="active"
									label="Visible"
									checked={size.active}
								/>
							</Table.Cell>

							<Table.Cell data-label="Uso" class="text-muted-foreground text-xs">
								{#if !size.active}
									<Badge variant="outline">
										<EyeOff class="mr-1 size-3" />
										Oculta
									</Badge>
								{:else if enUso > 0}
									{enUso} variantes
								{:else}
									sin usar
								{/if}
							</Table.Cell>

							<Table.Cell data-label="">
								<div class="flex items-center gap-1">
									<Button type="submit" form="talla-{size.id}" size="sm" variant="outline">
										Guardar
									</Button>

									<Button
										type="submit"
										form="borrar-talla-{size.id}"
										size="sm"
										variant="ghost"
										class="text-destructive"
										title={enUso > 0 ? 'Está en uso: se ocultará' : 'Borrar'}
										aria-label="Borrar talla {size.label}"
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

	<Card.Root>
		<Card.Header>
			<Card.Title>Categorías</Card.Title>
			<Card.Description>Aparecen en el menú de la tienda.</Card.Description>
		</Card.Header>

		<Card.Content class="space-y-4">
			<form
				method="POST"
				action="?/crearCategoria"
				class="bg-muted/50 flex flex-wrap items-end gap-3 rounded-lg p-4"
				use:enhance
			>
				<div class="space-y-1.5">
					<Label class="text-xs" for="cat-name">Nombre</Label>
					<Input id="cat-name" name="name" required placeholder="Chaquetas" class="w-56" />
				</div>

				<div class="space-y-1.5">
					<Label class="text-xs" for="cat-order">Orden</Label>
					<NumberField
						id="cat-order"
						name="sortOrder"
						value={nextOrder(data.categories)}
						class="w-32"
					/>
				</div>

				<div class="pb-2">
					<CheckboxField id="nueva-categoria" name="active" label="Visible" checked />
				</div>

				<Button type="submit" size="sm">Agregar categoría</Button>
			</form>

			<Table.Root class="table-stack">
				<Table.Header>
					<Table.Row>
						<Table.Head>Nombre</Table.Head>
						<Table.Head class="w-40">Enlace</Table.Head>
						<Table.Head class="w-36">Orden</Table.Head>
						<Table.Head class="w-28">Visible</Table.Head>
						<Table.Head class="w-28">Uso</Table.Head>
						<Table.Head class="w-32"></Table.Head>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{#each data.categories as category (`${category.id}:${category.active}`)}
						{@const enUso = usoCategoria(category.id)}
						<Table.Row>
							<Table.Cell data-label="Nombre">
								<Input
									form="categoria-{category.id}"
									name="name"
									value={category.name}
									aria-label="Nombre"
								/>
							</Table.Cell>

							<Table.Cell data-label="Enlace" class="text-muted-foreground font-mono text-xs">
								/{category.slug}
							</Table.Cell>

							<Table.Cell data-label="Orden">
								<NumberField
									form="categoria-{category.id}"
									name="sortOrder"
									value={category.sort_order}
									aria-label="Orden"
								/>
							</Table.Cell>

							<Table.Cell data-label="Visible">
								<CheckboxField
									id="cat-visible-{category.id}"
									form="categoria-{category.id}"
									name="active"
									label="Visible"
									checked={category.active}
								/>
							</Table.Cell>

							<Table.Cell data-label="Uso" class="text-muted-foreground text-xs">
								{enUso > 0 ? `${enUso} prendas` : 'sin usar'}
							</Table.Cell>

							<Table.Cell data-label="">
								<div class="flex items-center gap-1">
									<Button type="submit" form="categoria-{category.id}" size="sm" variant="outline">
										Guardar
									</Button>

									<Button
										type="submit"
										form="borrar-categoria-{category.id}"
										size="sm"
										variant="ghost"
										class="text-destructive"
										aria-label="Borrar {category.name}"
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
</div>

<!--
	Los formularios de cada fila viven fuera de la tabla: el HTML no admite
	<form> dentro de <tbody>, así que los campos lo referencian por id.
-->
<div hidden>
	{#each data.colors as color (color.id)}
		<form id="color-{color.id}" method="POST" action="?/actualizarColor" use:enhance>
			<input type="hidden" name="id" value={color.id} />
		</form>
		<form id="borrar-color-{color.id}" method="POST" action="?/borrarColor" use:enhance>
			<input type="hidden" name="id" value={color.id} />
		</form>
	{/each}

	{#each data.sizes as size (size.id)}
		<form id="talla-{size.id}" method="POST" action="?/actualizarTalla" use:enhance>
			<input type="hidden" name="id" value={size.id} />
		</form>
		<form id="borrar-talla-{size.id}" method="POST" action="?/borrarTalla" use:enhance>
			<input type="hidden" name="id" value={size.id} />
		</form>
	{/each}

	{#each data.categories as category (category.id)}
		<form id="categoria-{category.id}" method="POST" action="?/actualizarCategoria" use:enhance>
			<input type="hidden" name="id" value={category.id} />
		</form>
		<form id="borrar-categoria-{category.id}" method="POST" action="?/borrarCategoria" use:enhance>
			<input type="hidden" name="id" value={category.id} />
		</form>
	{/each}
</div>
