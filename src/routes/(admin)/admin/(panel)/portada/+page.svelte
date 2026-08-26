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

{#if error}
	<p class="text-destructive mb-4 text-sm">{error}</p>
{:else if message}
	<p class="text-success mb-4 text-sm">{message}</p>
{/if}

<section class="border-border bg-background mb-10 border p-6">
	<h2 class="mb-1 text-xl">Imagen de arriba</h2>
	<p class="text-muted-foreground mb-5 text-sm">
		Elige una colección para que su foto y su nombre encabecen la tienda. Si no eliges ninguna, se
		usan el título y el texto que escribas aquí.
	</p>

	<form method="POST" action="?/hero" class="space-y-5" use:enhance>
		<div class="space-y-2">
			<Label for="heroCollectionId">Colección destacada</Label>
			<select
				id="heroCollectionId"
				name="heroCollectionId"
				bind:value={heroCollectionId}
				class="border-border bg-background w-full max-w-md border px-3 py-2 text-sm"
			>
				<option value="">Ninguna: usar mi propio título</option>
				{#each data.collections as collection (collection.id)}
					<option value={collection.id}>{collection.name}</option>
				{/each}
			</select>

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

	<form
		method="POST"
		action="?/crearBloque"
		class="border-border bg-background grid gap-3 border p-4 md:grid-cols-[10rem_14rem_1fr_5rem_auto]"
		use:enhance
	>
		<div class="space-y-1">
			<Label class="text-xs" for="new-eyebrow">Etiqueta</Label>
			<Input id="new-eyebrow" name="eyebrow" required placeholder="Cambios" />
		</div>

		<div class="space-y-1">
			<Label class="text-xs" for="new-title">Título</Label>
			<Input id="new-title" name="title" required placeholder="Cambia sin problema" />
		</div>

		<div class="space-y-1">
			<Label class="text-xs" for="new-body">Texto</Label>
			<Input
				id="new-body"
				name="body"
				required
				placeholder="Tienes 8 días para cambiar tu prenda."
			/>
		</div>

		<div class="space-y-1">
			<Label class="text-xs" for="new-order">Orden</Label>
			<Input id="new-order" name="sortOrder" type="number" min="0" max="999" value={nextOrder} />
		</div>

		<div class="flex items-end gap-3 pb-1">
			<label class="flex items-center gap-2 text-xs">
				<input type="checkbox" name="active" checked class="accent-primary size-4" />
				Visible
			</label>
			<Button type="submit" size="sm">Agregar</Button>
		</div>
	</form>

	<div class="space-y-3">
		{#each data.highlights as highlight (`${highlight.id}:${highlight.active}`)}
			<div class="border-border bg-background flex flex-wrap items-end gap-3 border p-4">
				<form
					method="POST"
					action="?/actualizarBloque"
					class="flex flex-1 flex-wrap items-end gap-3"
					use:enhance
				>
					<input type="hidden" name="id" value={highlight.id} />

					<div class="space-y-1">
						<Label class="text-xs" for="eyebrow-{highlight.id}">Etiqueta</Label>
						<Input
							id="eyebrow-{highlight.id}"
							name="eyebrow"
							value={highlight.eyebrow}
							class="w-40"
						/>
					</div>

					<div class="space-y-1">
						<Label class="text-xs" for="title-{highlight.id}">Título</Label>
						<Input id="title-{highlight.id}" name="title" value={highlight.title} class="w-56" />
					</div>

					<div class="min-w-64 flex-1 space-y-1">
						<Label class="text-xs" for="body-{highlight.id}">Texto</Label>
						<Input id="body-{highlight.id}" name="body" value={highlight.body} />
					</div>

					<div class="space-y-1">
						<Label class="text-xs" for="order-{highlight.id}">Orden</Label>
						<Input
							id="order-{highlight.id}"
							name="sortOrder"
							type="number"
							min="0"
							max="999"
							value={highlight.sort_order}
							class="w-20"
						/>
					</div>

					<label class="flex items-center gap-2 pb-2 text-xs">
						<input
							type="checkbox"
							name="active"
							checked={highlight.active}
							class="accent-primary size-4"
						/>
						Visible
					</label>

					<Button type="submit" size="sm" variant="outline">Guardar</Button>
				</form>

				<form method="POST" action="?/borrarBloque" use:enhance>
					<input type="hidden" name="id" value={highlight.id} />
					<Button type="submit" size="sm" variant="ghost" class="text-destructive">
						<Trash2 class="size-3" />
					</Button>
				</form>
			</div>
		{/each}
	</div>
</section>
