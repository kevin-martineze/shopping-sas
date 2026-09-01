<script lang="ts">
	import ImagePlus from '@lucide/svelte/icons/image-plus';
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

<Card.Root class="mb-8">
	<Card.Header>
		<Card.Title>Nueva colección</Card.Title>
	</Card.Header>

	<Card.Content>
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
	</Card.Content>
</Card.Root>

{#if data.collections.length === 0}
	<p
		class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
	>
		Todavía no hay colecciones.
	</p>
{:else}
	<div class="space-y-6">
		{#each data.collections as collection (collection.id)}
			<Card.Root>
				<Card.Header>
					<div class="flex flex-wrap items-center gap-3">
						{#if collection.hero_image_url}
							<img
								src={collection.hero_image_url}
								alt=""
								class="bg-muted size-14 rounded-md object-cover"
							/>
						{/if}

						<div class="min-w-0 flex-1">
							<Card.Title class="text-base">{collection.name}</Card.Title>
							<Card.Description class="font-mono text-xs">
								/colecciones/{collection.slug}
							</Card.Description>
						</div>

						{#if !collection.active}
							<Badge variant="outline">Oculta</Badge>
						{/if}

						<Button
							href="/colecciones/{collection.slug}"
							target="_blank"
							size="sm"
							variant="outline"
						>
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
							<Button
								type="submit"
								size="sm"
								variant="ghost"
								class="text-destructive"
								aria-label="Borrar {collection.name}"
							>
								<Trash2 class="size-3" />
							</Button>
						</form>
					</div>
				</Card.Header>

				<Card.Content class="space-y-4">
					{#if linksOf(collection.id).length > 0}
						<Table.Root class="table-stack">
							<Table.Header>
								<Table.Row>
									<Table.Head>Prenda</Table.Head>
									<Table.Head class="w-56">Etiqueta sobre la foto</Table.Head>
									<Table.Head class="w-28"></Table.Head>
								</Table.Row>
							</Table.Header>

							<Table.Body>
								{#each linksOf(collection.id) as link (link.product_id)}
									<Table.Row>
										<Table.Cell data-label="Prenda" class="text-sm"
											>{link.products?.name ?? 'Prenda'}</Table.Cell
										>

										<Table.Cell
											data-label="Etiqueta sobre la foto"
											class="text-muted-foreground text-xs"
										>
											{#if link.hotspot_x !== null && link.hotspot_y !== null}
												{link.hotspot_x}% / {link.hotspot_y}%
											{:else}
												sin etiquetar
											{/if}
										</Table.Cell>

										<Table.Cell data-label="">
											<Button
												type="submit"
												form="quitar-{collection.id}-{link.product_id}"
												size="sm"
												variant="ghost"
												class="text-destructive"
											>
												Quitar
											</Button>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					{/if}

					<form
						method="POST"
						action="?/agregarProducto"
						class="bg-muted/50 flex flex-wrap items-end gap-3 rounded-lg p-4"
						use:enhance
					>
						<input type="hidden" name="collectionId" value={collection.id} />

						<div class="space-y-1.5">
							<Label class="text-xs" for="product-{collection.id}">Prenda</Label>
							<SelectField
								id="product-{collection.id}"
								name="productId"
								class="w-56"
								placeholder="Elige una prenda"
								options={productOptions}
							/>
						</div>

						<div class="space-y-1.5">
							<Label class="text-xs" for="x-{collection.id}">Posición X (%)</Label>
							<NumberField
								id="x-{collection.id}"
								name="hotspotX"
								value={50}
								max={100}
								class="w-32"
							/>
						</div>

						<div class="space-y-1.5">
							<Label class="text-xs" for="y-{collection.id}">Posición Y (%)</Label>
							<NumberField
								id="y-{collection.id}"
								name="hotspotY"
								value={50}
								max={100}
								class="w-32"
							/>
						</div>

						<Button type="submit" size="sm" variant="outline">Agregar prenda</Button>
					</form>
				</Card.Content>
			</Card.Root>

			<!-- El HTML no admite <form> dentro de <tbody>. -->
			<div hidden>
				{#each linksOf(collection.id) as link (link.product_id)}
					<form
						id="quitar-{collection.id}-{link.product_id}"
						method="POST"
						action="?/quitarProducto"
						use:enhance
					>
						<input type="hidden" name="collectionId" value={collection.id} />
						<input type="hidden" name="productId" value={link.product_id} />
					</form>
				{/each}
			</div>
		{/each}
	</div>
{/if}
