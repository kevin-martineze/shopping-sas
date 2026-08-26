<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Star from '@lucide/svelte/icons/star';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Tabs from '$lib/components/atoms/tabs';
	import ProductForm from '$lib/components/organisms/ProductForm.svelte';
	import VariantMatrix from '$lib/components/organisms/VariantMatrix.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	const product = $derived(data.product);
	const images = $derived([...product.product_images].sort((a, b) => a.sort_order - b.sort_order));

	let uploadColorId = $state('');
	let uploading = $state(false);
</script>

<svelte:head>
	<title>{product.name} — Panel</title>
</svelte:head>

<header class="mb-6 flex flex-wrap items-start justify-between gap-3">
	<div>
		<a
			href="/admin/productos"
			class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
		>
			<ArrowLeft class="size-3" />
			Productos
		</a>
		<h1 class="mt-1 text-3xl">{product.name}</h1>
	</div>

	<Button href="/tienda/{product.slug}" target="_blank" rel="noopener noreferrer" variant="outline">
		<ExternalLink class="mr-2 size-4" />
		Ver en la tienda
	</Button>
</header>

{#if form?.error}
	<p class="text-destructive mb-4 text-sm">{form.error}</p>
{/if}

<Tabs.Root value="datos">
	<Tabs.List>
		<Tabs.Trigger value="datos">Datos</Tabs.Trigger>
		<Tabs.Trigger value="fotos">Fotos ({images.length})</Tabs.Trigger>
		<Tabs.Trigger value="tallas">Tallas y stock ({product.variants.length})</Tabs.Trigger>
	</Tabs.List>

	<Tabs.Content value="datos" class="pt-6">
		<div class="border-border bg-background max-w-3xl border p-6">
			<ProductForm
				categories={data.categories}
				action="?/actualizar"
				submitLabel="Guardar cambios"
				error={null}
				values={{
					name: product.name,
					slug: product.slug,
					description: product.description ?? '',
					material: product.material ?? '',
					care: product.care ?? '',
					categoryId: product.category_id ?? '',
					basePrice: product.base_price,
					compareAtPrice: product.compare_at_price ?? '',
					status: product.status,
					featured: product.featured
				}}
			/>
		</div>

		<div class="border-destructive/40 mt-8 max-w-3xl border p-6">
			<h2 class="text-lg">Eliminar prenda</h2>
			<p class="text-muted-foreground mt-1 text-sm">
				Si la prenda ya salió en pedidos no se borra: se archiva para conservar el historial.
			</p>

			<form method="POST" action="?/eliminar" class="mt-4" use:enhance>
				<Button type="submit" variant="destructive" size="sm">
					<Trash2 class="mr-2 size-4" />
					Eliminar
				</Button>
			</form>
		</div>
	</Tabs.Content>

	<Tabs.Content value="fotos" class="pt-6">
		<div class="border-border bg-background space-y-6 border p-6">
			<form
				method="POST"
				action="?/subirImagen"
				enctype="multipart/form-data"
				class="flex flex-wrap items-end gap-3"
				use:enhance={() => {
					uploading = true;

					return async ({ update }) => {
						await update({ reset: true });
						uploading = false;
					};
				}}
			>
				<div class="space-y-2">
					<Label for="file">Nueva foto</Label>
					<Input id="file" name="file" type="file" accept="image/*" required class="w-64" />
				</div>

				<div class="space-y-2">
					<Label for="colorId">Color (opcional)</Label>
					<select
						id="colorId"
						name="colorId"
						bind:value={uploadColorId}
						class="border-border bg-background border px-3 py-2 text-sm"
					>
						<option value="">Todas</option>
						{#each data.colors as color (color.id)}
							<option value={color.id}>{color.name}</option>
						{/each}
					</select>
				</div>

				<Button type="submit" disabled={uploading}>
					{uploading ? 'Procesando…' : 'Subir'}
				</Button>

				<p class="text-muted-foreground w-full text-xs">
					Se guardan tres tamaños (400, 800 y 1600 px) en WebP. Máximo 12 MB por foto.
				</p>
			</form>

			{#if images.length === 0}
				<p class="text-muted-foreground text-sm">Esta prenda todavía no tiene fotos.</p>
			{:else}
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{#each images as image, index (image.id)}
						<div class="space-y-2">
							<div class="relative">
								<img
									src={image.url_card}
									alt=""
									class="bg-muted aspect-[3/4] w-full object-cover"
								/>

								{#if index === 0}
									<span
										class="bg-primary text-primary-foreground absolute top-2 left-2 px-2 py-0.5 text-[10px]"
									>
										Principal
									</span>
								{/if}
							</div>

							<div class="flex gap-1">
								{#if index !== 0}
									<form method="POST" action="?/imagenPrincipal" class="flex-1" use:enhance>
										<input type="hidden" name="imageId" value={image.id} />
										<Button type="submit" size="sm" variant="outline" class="w-full">
											<Star class="mr-1 size-3" />
											Principal
										</Button>
									</form>
								{/if}

								<form method="POST" action="?/borrarImagen" use:enhance>
									<input type="hidden" name="imageId" value={image.id} />
									<Button type="submit" size="sm" variant="ghost" class="text-destructive">
										<Trash2 class="size-3" />
									</Button>
								</form>
							</div>

							{#if image.color_id}
								<p class="text-muted-foreground text-xs">
									{data.colors.find((color) => color.id === image.color_id)?.name ?? ''}
								</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</Tabs.Content>

	<Tabs.Content value="tallas" class="pt-6">
		<VariantMatrix
			colors={data.colors}
			sizes={data.sizes}
			variants={product.variants}
			basePrice={product.base_price}
		/>
	</Tabs.Content>
</Tabs.Root>
