<script lang="ts">
	import ImagePlus from '@lucide/svelte/icons/image-plus';
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

	const productOptions = $derived(
		data.products.map((product) => ({ value: product.id, label: product.name }))
	);

	function linksOf(collectionId: string) {
		return data.links.filter((link) => link.collection_id === collectionId);
	}
</script>

<svelte:head>
	<title>Colecciones — Panel</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Colecciones</h1>
	<p class="text-muted-foreground text-sm">
		Páginas editoriales con una foto grande y prendas etiquetadas encima.
	</p>
</header>

<FormFeedback error={form?.error ?? null} />

<section class="border-border bg-background mb-8 border p-6">
	<h2 class="mb-4 text-lg">Nueva colección</h2>

	<form
		method="POST"
		action="?/crear"
		enctype="multipart/form-data"
		class="grid gap-4 sm:grid-cols-2"
		use:enhance
	>
		<div class="space-y-2">
			<Label for="name">Nombre</Label>
			<Input id="name" name="name" required placeholder="Temporada clara" />
		</div>

		<div class="space-y-2">
			<Label for="slug">Slug (opcional)</Label>
			<Input id="slug" name="slug" placeholder="temporada-clara" pattern="[a-z0-9-]+" />
		</div>

		<div class="space-y-2 sm:col-span-2">
			<Label for="file">Foto principal</Label>
			<Input id="file" name="file" type="file" accept="image/*" />
			<p class="text-muted-foreground text-xs">
				Se guarda en tres tamaños para que cargue rápido. Máximo 12 MB.
			</p>
		</div>

		<div class="space-y-2 sm:col-span-2">
			<Label for="description">Descripción</Label>
			<Textarea id="description" name="description" rows={2} />
		</div>

		<div class="sm:col-span-2">
			<CheckboxField id="active" name="active" label="Publicada" checked />
		</div>

		<div class="sm:col-span-2">
			<Button type="submit">Crear colección</Button>
		</div>
	</form>
</section>

{#if data.collections.length === 0}
	<p
		class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
	>
		Todavía no hay colecciones.
	</p>
{:else}
	<div class="space-y-6">
		{#each data.collections as collection (collection.id)}
			<section class="border-border bg-background border">
				<header class="border-border flex flex-wrap items-center gap-3 border-b p-4">
					{#if collection.hero_image_url}
						<img src={collection.hero_image_url} alt="" class="bg-muted size-14 object-cover" />
					{/if}

					<div class="min-w-0 flex-1">
						<p class="font-medium">{collection.name}</p>
						<p class="text-muted-foreground text-xs">/colecciones/{collection.slug}</p>
					</div>

					{#if !collection.active}
						<Badge variant="outline">Oculta</Badge>
					{/if}

					<Button href="/colecciones/{collection.slug}" target="_blank" size="sm" variant="outline">
						Ver
					</Button>

					<form
						method="POST"
						action="?/cambiarFoto"
						enctype="multipart/form-data"
						class="flex items-center gap-2"
						use:enhance
					>
						<input type="hidden" name="id" value={collection.id} />
						<Input
							name="file"
							type="file"
							accept="image/*"
							class="w-48"
							aria-label="Nueva foto de {collection.name}"
						/>
						<Button type="submit" size="sm" variant="outline">
							<ImagePlus class="mr-1 size-3" />
							Cambiar foto
						</Button>
					</form>

					<form method="POST" action="?/eliminar" use:enhance>
						<input type="hidden" name="id" value={collection.id} />
						<Button type="submit" size="sm" variant="ghost" class="text-destructive">
							<Trash2 class="size-3" />
						</Button>
					</form>
				</header>

				<div class="space-y-4 p-4">
					{#if linksOf(collection.id).length > 0}
						<ul class="divide-border divide-y">
							{#each linksOf(collection.id) as link (link.product_id)}
								<li class="flex items-center justify-between gap-3 py-2 text-sm">
									<span>
										{link.products?.name ?? 'Prenda'}
										{#if link.hotspot_x !== null && link.hotspot_y !== null}
											<span class="text-muted-foreground text-xs">
												· etiqueta en {link.hotspot_x}% / {link.hotspot_y}%
											</span>
										{/if}
									</span>

									<form method="POST" action="?/quitarProducto" use:enhance>
										<input type="hidden" name="collectionId" value={collection.id} />
										<input type="hidden" name="productId" value={link.product_id} />
										<Button type="submit" size="sm" variant="ghost" class="text-destructive">
											Quitar
										</Button>
									</form>
								</li>
							{/each}
						</ul>
					{/if}

					<form
						method="POST"
						action="?/agregarProducto"
						class="flex flex-wrap items-end gap-3"
						use:enhance
					>
						<input type="hidden" name="collectionId" value={collection.id} />

						<div class="space-y-1">
							<Label class="text-xs" for="product-{collection.id}">Prenda</Label>
							<SelectField
								id="product-{collection.id}"
								name="productId"
								class="w-56"
								placeholder="Elige una prenda"
								options={productOptions}
							/>
						</div>

						<div class="space-y-1">
							<Label class="text-xs" for="x-{collection.id}">Posición X (%)</Label>
							<Input
								id="x-{collection.id}"
								name="hotspotX"
								type="number"
								min="0"
								max="100"
								step="0.5"
								class="w-24"
							/>
						</div>

						<div class="space-y-1">
							<Label class="text-xs" for="y-{collection.id}">Posición Y (%)</Label>
							<Input
								id="y-{collection.id}"
								name="hotspotY"
								type="number"
								min="0"
								max="100"
								step="0.5"
								class="w-24"
							/>
						</div>

						<Button type="submit" size="sm" variant="outline">Agregar prenda</Button>
					</form>
				</div>
			</section>
		{/each}
	</div>
{/if}
