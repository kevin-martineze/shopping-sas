<script lang="ts">
	import { untrack } from 'svelte';

	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import { Textarea } from '$lib/components/atoms/textarea';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import NumberField from '$lib/components/molecules/NumberField.svelte';
	import SelectField from '$lib/components/molecules/SelectField.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// Copia editable del estado guardado; no se sincroniza sola.
	let heroCollectionId = $state(untrack(() => data.settings.hero_collection_id ?? ''));

	const message = $derived(form && 'message' in form ? form.message : null);
	const error = $derived(form && 'error' in form ? form.error : null);

	const nextOrder = $derived(
		data.highlights.reduce((max, highlight) => Math.max(max, highlight.sort_order), 0) + 1
	);

	const collectionOptions = $derived([
		{ value: '', label: 'Ninguna: usar mi propio título' },
		...data.collections.map((collection) => ({ value: collection.id, label: collection.name }))
	]);

	/** Mismas columnas para la cabecera y cada fila, así todo queda alineado. */
	const chosenCollection = $derived(
		data.collections.find((collection) => collection.id === heroCollectionId) ?? null
	);
</script>

<svelte:head>
	<title>Portada — Panel</title>
</svelte:head>

<header class="mb-6 space-y-1">
	<h1 class="text-3xl">Portada</h1>
	<p class="text-muted-foreground text-sm">
		Lo que ve alguien que entra por primera vez: la imagen grande de arriba y los tres mensajes de
		abajo.
	</p>
</header>

<FormFeedback {error} {message} />

<Card.Root class="mb-8">
	<Card.Header>
		<Card.Title>Imagen de arriba</Card.Title>
		<Card.Description>
			Elige una colección para que su foto y su nombre encabecen la tienda. Si no eliges ninguna, se
			usan el título y el texto que escribas aquí.
		</Card.Description>
	</Card.Header>

	<Card.Content>
		<form method="POST" action="?/hero" class="space-y-5" use:enhance>
			<div class="space-y-2">
				<Label for="heroCollectionId">Colección destacada</Label>
				<SelectField
					id="heroCollectionId"
					name="heroCollectionId"
					bind:value={heroCollectionId}
					class="max-w-md"
					placeholder="Ninguna: usar mi propio título"
					options={collectionOptions}
				/>

				{#if chosenCollection}
					<div class="flex items-center gap-3 pt-1">
						{#if chosenCollection.hero_image_url}
							<img
								src={chosenCollection.hero_image_url}
								alt=""
								class="bg-muted h-16 w-24 object-cover"
							/>
						{/if}
						<p class="text-muted-foreground text-xs">
							Se muestran la foto, el nombre y la descripción de esta colección.
							{#if !chosenCollection.active}
								<Badge variant="outline" class="ml-2">Está oculta en la tienda</Badge>
							{/if}
						</p>
					</div>
				{/if}
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<div class="space-y-2">
					<Label for="heroTitle">Título propio</Label>
					<Input
						id="heroTitle"
						name="heroTitle"
						value={data.settings.hero_title ?? ''}
						maxlength={120}
						placeholder="Prendas que duran más de una temporada"
						disabled={chosenCollection !== null}
					/>
				</div>

				<div class="space-y-2">
					<Label for="heroSubtitle">Texto de apoyo</Label>
					<Textarea
						id="heroSubtitle"
						name="heroSubtitle"
						rows={2}
						maxlength={300}
						value={data.settings.hero_subtitle ?? ''}
						placeholder="Selección corta, materiales nobles y tallas reales."
						disabled={chosenCollection !== null}
					/>
				</div>
			</div>

			<Button type="submit">Guardar portada</Button>
		</form>
	</Card.Content>
</Card.Root>

<Card.Root>
	<Card.Header>
		<Card.Title>Mensajes de abajo</Card.Title>
		<Card.Description>
			{data.highlights.length} bloques · se muestran en el orden que definas
		</Card.Description>
	</Card.Header>

	<Card.Content class="space-y-4">
		<form
			method="POST"
			action="?/crearBloque"
			class="bg-muted/50 flex flex-wrap items-end gap-3 rounded-lg p-4"
			use:enhance
		>
			<div class="space-y-1.5">
				<Label class="text-xs" for="new-eyebrow">Etiqueta</Label>
				<Input id="new-eyebrow" name="eyebrow" required placeholder="Cambios" class="w-40" />
			</div>

			<div class="space-y-1.5">
				<Label class="text-xs" for="new-title">Título</Label>
				<Input
					id="new-title"
					name="title"
					required
					placeholder="Cambia sin problema"
					class="w-56"
				/>
			</div>

			<div class="min-w-64 flex-1 space-y-1.5">
				<Label class="text-xs" for="new-body">Texto</Label>
				<Input
					id="new-body"
					name="body"
					required
					placeholder="Tienes 8 días para cambiar tu prenda."
				/>
			</div>

			<div class="space-y-1.5">
				<Label class="text-xs" for="new-order">Orden</Label>
				<NumberField id="new-order" name="sortOrder" value={nextOrder} max={999} class="w-32" />
			</div>

			<div class="pb-2">
				<CheckboxField id="nuevo-bloque-visible" name="active" label="Visible" checked />
			</div>

			<Button type="submit" size="sm">Agregar</Button>
		</form>

		{#if data.highlights.length > 0}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-44">Etiqueta</Table.Head>
						<Table.Head class="w-60">Título</Table.Head>
						<Table.Head>Texto</Table.Head>
						<Table.Head class="w-36">Orden</Table.Head>
						<Table.Head class="w-28">Visible</Table.Head>
						<Table.Head class="w-32"></Table.Head>
					</Table.Row>
				</Table.Header>

				<Table.Body>
					{#each data.highlights as highlight (`${highlight.id}:${highlight.active}`)}
						<Table.Row>
							<Table.Cell>
								<Input
									form="bloque-{highlight.id}"
									name="eyebrow"
									value={highlight.eyebrow}
									aria-label="Etiqueta"
								/>
							</Table.Cell>

							<Table.Cell>
								<Input
									form="bloque-{highlight.id}"
									name="title"
									value={highlight.title}
									aria-label="Título"
								/>
							</Table.Cell>

							<Table.Cell>
								<Input
									form="bloque-{highlight.id}"
									name="body"
									value={highlight.body}
									aria-label="Texto"
								/>
							</Table.Cell>

							<Table.Cell>
								<NumberField
									form="bloque-{highlight.id}"
									name="sortOrder"
									value={highlight.sort_order}
									max={999}
									aria-label="Orden"
								/>
							</Table.Cell>

							<Table.Cell>
								<CheckboxField
									id="bloque-visible-{highlight.id}"
									form="bloque-{highlight.id}"
									name="active"
									label="Visible"
									checked={highlight.active}
								/>
							</Table.Cell>

							<Table.Cell>
								<div class="flex items-center gap-1">
									<Button type="submit" form="bloque-{highlight.id}" size="sm" variant="outline">
										Guardar
									</Button>

									<Button
										type="submit"
										form="borrar-bloque-{highlight.id}"
										size="sm"
										variant="ghost"
										class="text-destructive"
										aria-label="Borrar mensaje"
									>
										<Trash2 class="size-3" />
									</Button>
								</div>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</Card.Content>
</Card.Root>

<!-- El HTML no admite <form> dentro de <tbody>: viven aquí y se referencian por id. -->
<div hidden>
	{#each data.highlights as highlight (highlight.id)}
		<form id="bloque-{highlight.id}" method="POST" action="?/actualizarBloque" use:enhance>
			<input type="hidden" name="id" value={highlight.id} />
		</form>

		<form id="borrar-bloque-{highlight.id}" method="POST" action="?/borrarBloque" use:enhance>
			<input type="hidden" name="id" value={highlight.id} />
		</form>
	{/each}
</div>
