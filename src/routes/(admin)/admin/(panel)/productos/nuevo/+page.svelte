<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	import type { ActionData, PageData } from './$types';
	import ProductForm from '$lib/components/organisms/ProductForm.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();
</script>

<svelte:head>
	<title>Nuevo producto — Globerce</title>
</svelte:head>

<header class="mb-6">
	<a
		href="/admin/productos"
		class="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
	>
		<ArrowLeft class="size-3" />
		Productos
	</a>
	<h1 class="mt-1 text-3xl">Nuevo producto</h1>
	<p class="text-muted-foreground text-sm">
		Al guardar podrás subir fotos y crear las variaciones con su inventario.
	</p>
</header>

<div class="border-border bg-card rounded-lg max-w-3xl border p-6">
	<ProductForm
		categories={data.categories}
		error={form?.error ?? null}
		submitLabel="Crear producto"
		values={{
			name: '',
			slug: '',
			description: '',
			categoryId: '',
			basePrice: '',
			compareAtPrice: '',
			status: 'draft',
			featured: false
		}}
	/>
</div>
