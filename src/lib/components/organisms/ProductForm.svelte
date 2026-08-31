<script lang="ts">
	import { untrack } from 'svelte';

	import type { Category } from '$lib/domain/catalog';

	import { enhance } from '$app/forms';

	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import { Switch } from '$lib/components/atoms/switch';
	import { Textarea } from '$lib/components/atoms/textarea';
	import SelectField from '$lib/components/molecules/SelectField.svelte';
	import { slugify } from '$lib/utils/slug';

	interface ProductValues {
		name: string;
		slug: string;
		description: string;
		material: string;
		care: string;
		categoryId: string;
		basePrice: number | '';
		compareAtPrice: number | '';
		status: 'draft' | 'active' | 'archived';
		featured: boolean;
	}

	interface Props {
		categories: Category[];
		values: ProductValues;
		action?: string;
		submitLabel: string;
		error?: string | null;
	}

	let { categories, values, action = '', submitLabel, error = null }: Props = $props();

	// Copia local editable: nunca se mutan las props.
	let form = $state(
		untrack(() => ({
			name: values.name,
			slug: values.slug,
			description: values.description,
			material: values.material,
			care: values.care,
			categoryId: values.categoryId,
			basePrice: values.basePrice,
			compareAtPrice: values.compareAtPrice,
			status: values.status,
			featured: values.featured
		}))
	);
	let slugTouched = $state(untrack(() => values.slug !== ''));
	let submitting = $state(false);

	const categoryOptions = $derived([
		{ value: '', label: 'Sin categoría' },
		...categories.map((category) => ({ value: category.id, label: category.name }))
	]);

	// El slug se deriva del nombre hasta que alguien lo escriba a mano.
	$effect(() => {
		if (!slugTouched) form.slug = slugify(form.name);
	});
</script>

<form
	method="POST"
	{action}
	class="space-y-6"
	use:enhance={() => {
		submitting = true;

		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<div class="grid gap-4 sm:grid-cols-2">
		<div class="space-y-2 sm:col-span-2">
			<Label for="name">Nombre</Label>
			<Input id="name" name="name" bind:value={form.name} required maxlength={120} />
		</div>

		<div class="space-y-2 sm:col-span-2">
			<Label for="slug">Slug (URL)</Label>
			<Input
				id="slug"
				name="slug"
				bind:value={form.slug}
				oninput={() => (slugTouched = true)}
				pattern="[a-z0-9-]+"
			/>
			<p class="text-muted-foreground text-xs">/tienda/{form.slug || 'nombre-de-la-prenda'}</p>
		</div>

		<div class="space-y-2">
			<Label for="basePrice">Precio</Label>
			<Input
				id="basePrice"
				name="basePrice"
				type="number"
				min="0"
				step="1000"
				bind:value={form.basePrice}
				required
			/>
		</div>

		<div class="space-y-2">
			<Label for="compareAtPrice">Precio tachado (opcional)</Label>
			<Input
				id="compareAtPrice"
				name="compareAtPrice"
				type="number"
				min="0"
				step="1000"
				bind:value={form.compareAtPrice}
			/>
		</div>

		<div class="space-y-2">
			<Label for="categoryId">Categoría</Label>
			<SelectField
				id="categoryId"
				name="categoryId"
				bind:value={form.categoryId}
				placeholder="Sin categoría"
				options={categoryOptions}
			/>
		</div>

		<div class="space-y-2">
			<Label for="status">Estado</Label>
			<SelectField
				id="status"
				name="status"
				bind:value={form.status}
				options={[
					{ value: 'draft', label: 'Borrador' },
					{ value: 'active', label: 'Publicado' },
					{ value: 'archived', label: 'Archivado' }
				]}
			/>
		</div>

		<div class="space-y-2 sm:col-span-2">
			<Label for="description">Descripción</Label>
			<Textarea id="description" name="description" bind:value={form.description} rows={4} />
		</div>

		<div class="space-y-2">
			<Label for="material">Materiales</Label>
			<Input id="material" name="material" bind:value={form.material} />
		</div>

		<div class="space-y-2">
			<Label for="care">Cuidados</Label>
			<Input id="care" name="care" bind:value={form.care} />
		</div>

		<div class="flex items-center gap-3 sm:col-span-2">
			<Switch id="featured" name="featured" bind:checked={form.featured} />
			<Label for="featured">Destacar en la portada</Label>
		</div>
	</div>

	{#if error}
		<p class="text-destructive text-sm">{error}</p>
	{/if}

	<Button type="submit" disabled={submitting}>
		{submitting ? 'Guardando…' : submitLabel}
	</Button>
</form>
