<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let newColorHex = $state('#c9c2b6');

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

{#if error}
	<p class="text-destructive mb-4 text-sm">{error}</p>
{:else if message}
	<p class="text-success mb-4 text-sm">{message}</p>
{/if}

<div class="space-y-10">
	<section class="space-y-4">
		<div class="flex items-baseline justify-between gap-3">
			<h2 class="text-xl">Colores</h2>
			<span class="text-muted-foreground text-xs">{data.colors.length} en total</span>
		</div>

		<form
			method="POST"
			action="?/crearColor"
			class="border-border bg-background flex flex-wrap items-end gap-3 border p-4"
			use:enhance
		>
			<div class="space-y-1">
				<Label class="text-xs" for="color-name">Nombre</Label>
				<Input id="color-name" name="name" required placeholder="Verde menta" class="w-48" />
			</div>

			<div class="space-y-1">
				<Label class="text-xs" for="color-hex">Tono</Label>
				<div class="flex items-center gap-2">
					<input
						id="color-hex"
						name="hex"
						type="color"
						bind:value={newColorHex}
						class="border-border size-9 cursor-pointer border bg-transparent"
						aria-label="Elegir tono"
					/>
					<span class="text-muted-foreground font-mono text-xs">{newColorHex.toUpperCase()}</span>
				</div>
			</div>

			<div class="space-y-1">
				<Label class="text-xs" for="color-order">Orden</Label>
				<Input
					id="color-order"
					name="sortOrder"
					type="number"
					min="0"
					max="999"
					value={nextOrder(data.colors)}
					class="w-20"
				/>
			</div>

			<label class="flex items-center gap-2 pb-2 text-xs">
				<input type="checkbox" name="active" checked class="accent-primary size-4" />
				Visible
			</label>

			<Button type="submit" size="sm">Agregar color</Button>
		</form>

		<div class="border-border bg-background divide-border divide-y border">
			{#each data.colors as color (`${color.id}:${color.active}`)}
				{@const enUso = usoColor(color.id)}
				<div class="flex flex-wrap items-center gap-3 p-3">
					<form
						method="POST"
						action="?/actualizarColor"
						class="flex flex-1 flex-wrap items-center gap-3"
						use:enhance
					>
						<input type="hidden" name="id" value={color.id} />

						<input
							name="hex"
							type="color"
							value={color.hex}
							class="border-border size-8 flex-none cursor-pointer border bg-transparent"
							aria-label="Tono de {color.name}"
						/>

						<Input name="name" value={color.name} class="w-44" aria-label="Nombre del color" />

						<Input
							name="sortOrder"
							type="number"
							min="0"
							max="999"
							value={color.sort_order}
							class="w-20"
							aria-label="Orden"
						/>

						<label class="flex items-center gap-2 text-xs">
							<input
								type="checkbox"
								name="active"
								checked={color.active}
								class="accent-primary size-4"
							/>
							Visible
						</label>

						{#if !color.active}
							<Badge variant="outline">
								<EyeOff class="mr-1 size-3" />
								Oculto
							</Badge>
						{:else if enUso > 0}
							<Badge variant="secondary">
								<Eye class="mr-1 size-3" />
								{enUso} variantes
							</Badge>
						{/if}

						<Button type="submit" size="sm" variant="outline">Guardar</Button>
					</form>

					<form method="POST" action="?/borrarColor" use:enhance>
						<input type="hidden" name="id" value={color.id} />
						<Button
							type="submit"
							size="sm"
							variant="ghost"
							class="text-destructive"
							title={enUso > 0 ? 'Está en uso: se ocultará' : 'Borrar'}
						>
							<Trash2 class="size-3" />
						</Button>
					</form>
				</div>
			{/each}
		</div>
	</section>

	<section class="space-y-4">
		<div class="flex items-baseline justify-between gap-3">
			<h2 class="text-xl">Tallas</h2>
			<span class="text-muted-foreground text-xs">
				El orden manda sobre el alfabético: así XL queda después de L.
			</span>
		</div>

		<form
			method="POST"
			action="?/crearTalla"
			class="border-border bg-background flex flex-wrap items-end gap-3 border p-4"
			use:enhance
		>
			<div class="space-y-1">
				<Label class="text-xs" for="size-label">Talla</Label>
				<Input id="size-label" name="label" required placeholder="XXL" class="w-28 uppercase" />
			</div>

			<div class="space-y-1">
				<Label class="text-xs" for="size-order">Orden</Label>
				<Input
					id="size-order"
					name="sortOrder"
					type="number"
					min="0"
					max="999"
					value={nextOrder(data.sizes)}
					class="w-20"
				/>
			</div>

			<label class="flex items-center gap-2 pb-2 text-xs">
				<input type="checkbox" name="active" checked class="accent-primary size-4" />
				Visible
			</label>

			<Button type="submit" size="sm">Agregar talla</Button>
		</form>

		<div class="border-border bg-background divide-border divide-y border">
			{#each data.sizes as size (`${size.id}:${size.active}`)}
				{@const enUso = usoTalla(size.id)}
				<div class="flex flex-wrap items-center gap-3 p-3">
					<form
						method="POST"
						action="?/actualizarTalla"
						class="flex flex-1 flex-wrap items-center gap-3"
						use:enhance
					>
						<input type="hidden" name="id" value={size.id} />

						<Input name="label" value={size.label} class="w-28 uppercase" aria-label="Talla" />

						<Input
							name="sortOrder"
							type="number"
							min="0"
							max="999"
							value={size.sort_order}
							class="w-20"
							aria-label="Orden"
						/>

						<label class="flex items-center gap-2 text-xs">
							<input
								type="checkbox"
								name="active"
								checked={size.active}
								class="accent-primary size-4"
							/>
							Visible
						</label>

						{#if !size.active}
							<Badge variant="outline">
								<EyeOff class="mr-1 size-3" />
								Oculta
							</Badge>
						{:else if enUso > 0}
							<Badge variant="secondary">{enUso} variantes</Badge>
						{/if}

						<Button type="submit" size="sm" variant="outline">Guardar</Button>
					</form>

					<form method="POST" action="?/borrarTalla" use:enhance>
						<input type="hidden" name="id" value={size.id} />
						<Button
							type="submit"
							size="sm"
							variant="ghost"
							class="text-destructive"
							title={enUso > 0 ? 'Está en uso: se ocultará' : 'Borrar'}
						>
							<Trash2 class="size-3" />
						</Button>
					</form>
				</div>
			{/each}
		</div>
	</section>

	<section class="space-y-4">
		<div class="flex items-baseline justify-between gap-3">
			<h2 class="text-xl">Categorías</h2>
			<span class="text-muted-foreground text-xs">Aparecen en el menú de la tienda.</span>
		</div>

		<form
			method="POST"
			action="?/crearCategoria"
			class="border-border bg-background flex flex-wrap items-end gap-3 border p-4"
			use:enhance
		>
			<div class="space-y-1">
				<Label class="text-xs" for="cat-name">Nombre</Label>
				<Input id="cat-name" name="name" required placeholder="Chaquetas" class="w-56" />
			</div>

			<div class="space-y-1">
				<Label class="text-xs" for="cat-order">Orden</Label>
				<Input
					id="cat-order"
					name="sortOrder"
					type="number"
					min="0"
					max="999"
					value={nextOrder(data.categories)}
					class="w-20"
				/>
			</div>

			<label class="flex items-center gap-2 pb-2 text-xs">
				<input type="checkbox" name="active" checked class="accent-primary size-4" />
				Visible
			</label>

			<Button type="submit" size="sm">Agregar categoría</Button>
		</form>

		<div class="border-border bg-background divide-border divide-y border">
			{#each data.categories as category (`${category.id}:${category.active}`)}
				{@const enUso = usoCategoria(category.id)}
				<div class="flex flex-wrap items-center gap-3 p-3">
					<form
						method="POST"
						action="?/actualizarCategoria"
						class="flex flex-1 flex-wrap items-center gap-3"
						use:enhance
					>
						<input type="hidden" name="id" value={category.id} />

						<Input name="name" value={category.name} class="w-56" aria-label="Nombre" />

						<span class="text-muted-foreground w-40 truncate font-mono text-xs">
							/{category.slug}
						</span>

						<Input
							name="sortOrder"
							type="number"
							min="0"
							max="999"
							value={category.sort_order}
							class="w-20"
							aria-label="Orden"
						/>

						<label class="flex items-center gap-2 text-xs">
							<input
								type="checkbox"
								name="active"
								checked={category.active}
								class="accent-primary size-4"
							/>
							Visible
						</label>

						{#if enUso > 0}
							<Badge variant="secondary">{enUso} prendas</Badge>
						{/if}

						<Button type="submit" size="sm" variant="outline">Guardar</Button>
					</form>

					<form method="POST" action="?/borrarCategoria" use:enhance>
						<input type="hidden" name="id" value={category.id} />
						<Button type="submit" size="sm" variant="ghost" class="text-destructive">
							<Trash2 class="size-3" />
						</Button>
					</form>
				</div>
			{/each}
		</div>
	</section>
</div>
