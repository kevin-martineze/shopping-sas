<script lang="ts">
	import { untrack } from 'svelte';

	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import type { StorefrontDraft } from '$lib/domain/preview';
	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import NumberField from '$lib/components/molecules/NumberField.svelte';
	import LivePreviewLayout from '$lib/components/organisms/LivePreviewLayout.svelte';
	import { themePreviewUrl } from '$lib/template-preview';
	import { slugify } from '$lib/utils/slug';

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

	function usoCategoria(id: string): number {
		return data.usage.categories[id] ?? 0;
	}

	/**
	 * Los cambios de cada fila viven aquí, por id. Así la tabla sigue pintando
	 * lo guardado y lo que la dueña escribe se suma sin tocar `data`.
	 */
	interface CategoryEdit {
		name?: string;
		sortOrder?: number;
		active?: boolean;
	}

	let categoryEdits = $state<Record<string, CategoryEdit>>({});

	// La categoría que se está creando también se ve, sin esperar a guardarla.
	let newName = $state('');
	let newSortOrder = $state(untrack(() => nextOrder(data.categories)));
	let newActive = $state(true);

	const rows = $derived(
		data.categories.map((category) => ({
			id: category.id,
			name: categoryEdits[category.id]?.name ?? category.name,
			slug: category.slug,
			sortOrder: categoryEdits[category.id]?.sortOrder ?? category.sort_order,
			active: categoryEdits[category.id]?.active ?? category.active
		}))
	);

	const draftCategories = $derived([
		...rows,
		...(newName.trim()
			? [
					{
						id: 'nueva',
						name: newName,
						slug: slugify(newName),
						sortOrder: newSortOrder,
						active: newActive
					}
				]
			: [])
	]);

	const draft = $derived<StorefrontDraft>({
		template: data.settings.template,
		theme: data.settings.theme,
		content: { kind: 'categories', categories: draftCategories },
		focus: 'categories-menu'
	});

	const previewSrc = $derived(
		themePreviewUrl(
			new URL('/', data.previewUrl).toString(),
			data.settings.template,
			data.settings.theme
		)
	);

	function editCategory(id: string, patch: CategoryEdit) {
		categoryEdits[id] = { ...categoryEdits[id], ...patch };
	}
</script>

<svelte:head>
	<title>Categorías — Globerce</title>
</svelte:head>

<header class="mb-6 space-y-1">
	<h1 class="text-3xl">Categorías</h1>
	<p class="text-muted-foreground text-sm">
		Cómo agrupas tus productos en la tienda. Lo que ya esté en uso no se borra: se oculta, y los
		pedidos viejos lo siguen mostrando.
	</p>
	<p class="text-muted-foreground text-sm">
		Las variaciones, los colores y cualquier otra variación se declaran en cada producto, porque no
		todos se dividen igual: una camisa por variación, un café por molienda y peso, un libro por
		nada.
	</p>
</header>

<FormFeedback {error} {message} />

<LivePreviewLayout src={previewSrc} {draft} title="Así se ve tu menú">
	<div class="space-y-8">
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
						<Input
							id="cat-name"
							name="name"
							required
							placeholder="Chaquetas"
							class="w-56"
							bind:value={newName}
						/>
					</div>

					<div class="space-y-1.5">
						<Label class="text-xs" for="cat-order">Orden</Label>
						<NumberField id="cat-order" name="sortOrder" bind:value={newSortOrder} class="w-32" />
					</div>

					<div class="pb-2">
						<CheckboxField
							id="nueva-categoria"
							name="active"
							label="Visible"
							bind:checked={newActive}
						/>
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
						{#each rows as category (category.id)}
							{@const enUso = usoCategoria(category.id)}
							<Table.Row>
								<Table.Cell data-label="Nombre">
									<Input
										form="categoria-{category.id}"
										name="name"
										value={category.name}
										oninput={(event) =>
											editCategory(category.id, { name: event.currentTarget.value })}
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
										value={category.sortOrder}
										onchange={(value) => editCategory(category.id, { sortOrder: value })}
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
										onchange={(checked) => editCategory(category.id, { active: checked })}
									/>
								</Table.Cell>

								<Table.Cell data-label="Uso" class="text-muted-foreground text-xs">
									{enUso > 0 ? `${enUso} productos` : 'sin usar'}
								</Table.Cell>

								<Table.Cell data-label="">
									<div class="flex items-center gap-1">
										<Button
											type="submit"
											form="categoria-{category.id}"
											size="sm"
											variant="outline"
										>
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
</LivePreviewLayout>

<!--
	Los formularios de cada fila viven fuera de la tabla: el HTML no admite
	<form> dentro de <tbody>, así que los campos lo referencian por id.
-->
<div hidden>
	{#each data.categories as category (category.id)}
		<form id="categoria-{category.id}" method="POST" action="?/actualizarCategoria" use:enhance>
			<input type="hidden" name="id" value={category.id} />
		</form>
		<form id="borrar-categoria-{category.id}" method="POST" action="?/borrarCategoria" use:enhance>
			<input type="hidden" name="id" value={category.id} />
		</form>
	{/each}
</div>
