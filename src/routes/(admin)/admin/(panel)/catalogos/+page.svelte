<script lang="ts">
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let newColorHex = $state('#c9c2b6');

	const message = $derived(form && 'message' in form ? form.message : null);
	const error = $derived(form && 'error' in form ? form.error : null);

	/**
	 * Mismas columnas para la cabecera y para cada fila: si cambian aquí, la
	 * lista entera sigue alineada.
	 */
	const COLOR_ROW =
		'grid items-center gap-3 md:grid-cols-[2.5rem_minmax(0,1fr)_5rem_7rem_8rem_8rem]';
	const SIZE_ROW = 'grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_5rem_7rem_8rem_8rem]';
	const CATEGORY_ROW =
		'grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_9rem_5rem_7rem_8rem_8rem]';

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

<div class="space-y-12">
	<section class="space-y-3">
		<div class="flex items-baseline justify-between gap-3">
			<h2 class="text-xl">Colores</h2>
			<span class="text-muted-foreground text-xs">{data.colors.length} en total</span>
		</div>

		<!-- El alta va sobre fondo distinto para no confundirse con las filas. -->
		<form
			method="POST"
			action="?/crearColor"
			class="border-border bg-muted/50 space-y-3 border p-4"
			use:enhance
		>
			<p class="text-sm font-medium">Nuevo color</p>

			<div class="flex flex-wrap items-end gap-3">
				<div class="space-y-1">
					<Label class="text-xs" for="color-hex">Tono</Label>
					<input
						id="color-hex"
						name="hex"
						type="color"
						bind:value={newColorHex}
						class="border-border block size-9 cursor-pointer border bg-transparent"
					/>
				</div>

				<div class="space-y-1">
					<Label class="text-xs" for="color-name">Nombre</Label>
					<Input id="color-name" name="name" required placeholder="Verde menta" class="w-52" />
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

				<div class="pb-2">
					<CheckboxField id="nuevo-color" name="active" label="Visible" checked />
				</div>

				<Button type="submit" size="sm">Agregar color</Button>
			</div>
		</form>

		<div class="border-border bg-background border">
			<!-- Los nombres de columna van una vez, no repetidos en cada fila. -->
			<div
				class="{COLOR_ROW} border-border text-muted-foreground border-b px-4 py-2 text-xs tracking-wide uppercase"
			>
				<span>Tono</span>
				<span>Nombre</span>
				<span>Orden</span>
				<span>Visible</span>
				<span>Uso</span>
				<span></span>
			</div>

			<div class="divide-border divide-y">
				{#each data.colors as color (`${color.id}:${color.active}`)}
					{@const enUso = usoColor(color.id)}
					<div class="{COLOR_ROW} px-4 py-3">
						<input
							form="color-{color.id}"
							name="hex"
							type="color"
							value={color.hex}
							class="border-border block size-8 cursor-pointer border bg-transparent"
							aria-label="Tono de {color.name}"
						/>

						<Input
							form="color-{color.id}"
							name="name"
							value={color.name}
							aria-label="Nombre del color"
						/>

						<Input
							form="color-{color.id}"
							name="sortOrder"
							type="number"
							min="0"
							max="999"
							value={color.sort_order}
							aria-label="Orden"
						/>

						<CheckboxField
							id="color-visible-{color.id}"
							form="color-{color.id}"
							name="active"
							label="Visible"
							checked={color.active}
						/>

						<span class="text-muted-foreground text-xs">
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
						</span>

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
					</div>

					<!-- Los formularios viven fuera de la grilla para no romper la alineación. -->
					<form id="color-{color.id}" method="POST" action="?/actualizarColor" use:enhance>
						<input type="hidden" name="id" value={color.id} />
					</form>

					<form id="borrar-color-{color.id}" method="POST" action="?/borrarColor" use:enhance>
						<input type="hidden" name="id" value={color.id} />
					</form>
				{/each}
			</div>
		</div>
	</section>

	<section class="space-y-3">
		<div class="flex items-baseline justify-between gap-3">
			<h2 class="text-xl">Tallas</h2>
			<span class="text-muted-foreground text-xs">
				El orden manda sobre el alfabético: así XL queda después de L.
			</span>
		</div>

		<form
			method="POST"
			action="?/crearTalla"
			class="border-border bg-muted/50 space-y-3 border p-4"
			use:enhance
		>
			<p class="text-sm font-medium">Nueva talla</p>

			<div class="flex flex-wrap items-end gap-3">
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

				<div class="pb-2">
					<CheckboxField id="nueva-talla" name="active" label="Visible" checked />
				</div>

				<Button type="submit" size="sm">Agregar talla</Button>
			</div>
		</form>

		<div class="border-border bg-background border">
			<div
				class="{SIZE_ROW} border-border text-muted-foreground border-b px-4 py-2 text-xs tracking-wide uppercase"
			>
				<span>Talla</span>
				<span>Orden</span>
				<span>Visible</span>
				<span>Uso</span>
				<span></span>
			</div>

			<div class="divide-border divide-y">
				{#each data.sizes as size (`${size.id}:${size.active}`)}
					{@const enUso = usoTalla(size.id)}
					<div class="{SIZE_ROW} px-4 py-3">
						<Input
							form="talla-{size.id}"
							name="label"
							value={size.label}
							class="uppercase"
							aria-label="Talla"
						/>

						<Input
							form="talla-{size.id}"
							name="sortOrder"
							type="number"
							min="0"
							max="999"
							value={size.sort_order}
							aria-label="Orden"
						/>

						<CheckboxField
							id="size-visible-{size.id}"
							form="talla-{size.id}"
							name="active"
							label="Visible"
							checked={size.active}
						/>

						<span class="text-muted-foreground text-xs">
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
						</span>

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
					</div>

					<form id="talla-{size.id}" method="POST" action="?/actualizarTalla" use:enhance>
						<input type="hidden" name="id" value={size.id} />
					</form>

					<form id="borrar-talla-{size.id}" method="POST" action="?/borrarTalla" use:enhance>
						<input type="hidden" name="id" value={size.id} />
					</form>
				{/each}
			</div>
		</div>
	</section>

	<section class="space-y-3">
		<div class="flex items-baseline justify-between gap-3">
			<h2 class="text-xl">Categorías</h2>
			<span class="text-muted-foreground text-xs">Aparecen en el menú de la tienda.</span>
		</div>

		<form
			method="POST"
			action="?/crearCategoria"
			class="border-border bg-muted/50 space-y-3 border p-4"
			use:enhance
		>
			<p class="text-sm font-medium">Nueva categoría</p>

			<div class="flex flex-wrap items-end gap-3">
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

				<div class="pb-2">
					<CheckboxField id="nueva-categoria" name="active" label="Visible" checked />
				</div>

				<Button type="submit" size="sm">Agregar categoría</Button>
			</div>
		</form>

		<div class="border-border bg-background border">
			<div
				class="{CATEGORY_ROW} border-border text-muted-foreground border-b px-4 py-2 text-xs tracking-wide uppercase"
			>
				<span>Nombre</span>
				<span>Enlace</span>
				<span>Orden</span>
				<span>Visible</span>
				<span>Uso</span>
				<span></span>
			</div>

			<div class="divide-border divide-y">
				{#each data.categories as category (`${category.id}:${category.active}`)}
					{@const enUso = usoCategoria(category.id)}
					<div class="{CATEGORY_ROW} px-4 py-3">
						<Input
							form="categoria-{category.id}"
							name="name"
							value={category.name}
							aria-label="Nombre"
						/>

						<span class="text-muted-foreground truncate font-mono text-xs">/{category.slug}</span>

						<Input
							form="categoria-{category.id}"
							name="sortOrder"
							type="number"
							min="0"
							max="999"
							value={category.sort_order}
							aria-label="Orden"
						/>

						<CheckboxField
							id="cat-visible-{category.id}"
							form="categoria-{category.id}"
							name="active"
							label="Visible"
							checked={category.active}
						/>

						<span class="text-muted-foreground text-xs">
							{enUso > 0 ? `${enUso} prendas` : 'sin usar'}
						</span>

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
					</div>

					<form
						id="categoria-{category.id}"
						method="POST"
						action="?/actualizarCategoria"
						use:enhance
					>
						<input type="hidden" name="id" value={category.id} />
					</form>

					<form
						id="borrar-categoria-{category.id}"
						method="POST"
						action="?/borrarCategoria"
						use:enhance
					>
						<input type="hidden" name="id" value={category.id} />
					</form>
				{/each}
			</div>
		</div>
	</section>
</div>
