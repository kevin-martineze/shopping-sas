<script lang="ts">
	import { untrack } from 'svelte';

	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import { Textarea } from '$lib/components/atoms/textarea';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
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
	const ROW = 'grid items-center gap-3 md:grid-cols-[9rem_13rem_minmax(0,1fr)_6rem_7rem_8rem]';

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

<section class="border-border bg-background mb-10 border p-6">
	<h2 class="mb-1 text-xl">Imagen de arriba</h2>
	<p class="text-muted-foreground mb-5 text-sm">
		Elige una colección para que su foto y su nombre encabecen la tienda. Si no eliges ninguna, se
		usan el título y el texto que escribas aquí.
	</p>

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
</section>

<section class="space-y-4">
	<div class="flex items-baseline justify-between gap-3">
		<h2 class="text-xl">Mensajes de abajo</h2>
		<span class="text-muted-foreground text-xs">
			{data.highlights.length} bloques · se muestran en el orden que definas
		</span>
	</div>

	<!-- Alta: fondo distinto para que no se confunda con las filas existentes. -->
	<form
		method="POST"
		action="?/crearBloque"
		class="border-border bg-muted/50 space-y-3 border p-4"
		use:enhance
	>
		<p class="text-sm font-medium">Nuevo mensaje</p>

		<div class={ROW}>
			<Input name="eyebrow" required placeholder="Cambios" aria-label="Etiqueta" />
			<Input name="title" required placeholder="Cambia sin problema" aria-label="Título" />
			<Input
				name="body"
				required
				placeholder="Tienes 8 días para cambiar tu prenda."
				aria-label="Texto"
			/>
			<Input
				name="sortOrder"
				type="number"
				min="0"
				max="999"
				value={nextOrder}
				aria-label="Orden"
			/>
			<CheckboxField id="nuevo-bloque-visible" name="active" label="Visible" checked />
			<Button type="submit" size="sm">Agregar</Button>
		</div>
	</form>

	{#if data.highlights.length > 0}
		<div class="border-border bg-background border">
			<!-- Los nombres de columna van una sola vez, no en cada fila. -->
			<div
				class="{ROW} border-border text-muted-foreground border-b px-4 py-2 text-xs tracking-wide uppercase"
			>
				<span>Etiqueta</span>
				<span>Título</span>
				<span>Texto</span>
				<span>Orden</span>
				<span>Visible</span>
				<span></span>
			</div>

			<div class="divide-border divide-y">
				{#each data.highlights as highlight (`${highlight.id}:${highlight.active}`)}
					<div class="{ROW} px-4 py-3">
						<Input
							form="bloque-{highlight.id}"
							name="eyebrow"
							value={highlight.eyebrow}
							aria-label="Etiqueta"
						/>
						<Input
							form="bloque-{highlight.id}"
							name="title"
							value={highlight.title}
							aria-label="Título"
						/>
						<Input
							form="bloque-{highlight.id}"
							name="body"
							value={highlight.body}
							aria-label="Texto"
						/>
						<Input
							form="bloque-{highlight.id}"
							name="sortOrder"
							type="number"
							min="0"
							max="999"
							value={highlight.sort_order}
							aria-label="Orden"
						/>

						<CheckboxField
							id="bloque-visible-{highlight.id}"
							form="bloque-{highlight.id}"
							name="active"
							label="Visible"
							checked={highlight.active}
						/>

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
					</div>

					<!-- Los formularios viven fuera de la grilla para no romper la alineación. -->
					<form id="bloque-{highlight.id}" method="POST" action="?/actualizarBloque" use:enhance>
						<input type="hidden" name="id" value={highlight.id} />
					</form>

					<form id="borrar-bloque-{highlight.id}" method="POST" action="?/borrarBloque" use:enhance>
						<input type="hidden" name="id" value={highlight.id} />
					</form>
				{/each}
			</div>
		</div>
	{/if}
</section>
