<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	import type { ActionData, PageData } from './$types';
	import type { StorefrontDraft } from '$lib/domain/preview';
	import type { ProductFormValues } from '$lib/domain/product-form';
	import LivePreviewLayout from '$lib/components/organisms/LivePreviewLayout.svelte';
	import ProductForm from '$lib/components/organisms/ProductForm.svelte';
	import { themePreviewUrl } from '$lib/template-preview';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let live = $state<ProductFormValues>({
		name: '',
		slug: '',
		description: '',
		categoryId: '',
		basePrice: '',
		compareAtPrice: '',
		status: 'draft',
		featured: false
	});

	const draft = $derived<StorefrontDraft>({
		template: data.settings.template,
		theme: data.settings.theme,
		content: {
			kind: 'product',
			name: live.name,
			slug: live.slug,
			description: live.description,
			categoryId: live.categoryId || null,
			basePrice: typeof live.basePrice === 'number' ? live.basePrice : 0,
			compareAtPrice: typeof live.compareAtPrice === 'number' ? live.compareAtPrice : null,
			status: live.status,
			featured: live.featured,
			image: null
		},
		focus: 'product-card'
	});

	const previewSrc = $derived(
		themePreviewUrl(
			new URL('/vista-previa/producto', data.previewUrl).toString(),
			data.settings.template,
			data.settings.theme
		)
	);
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

<LivePreviewLayout src={previewSrc} {draft} title="Así se ve tu producto">
	<div class="border-border bg-card rounded-lg border p-6">
		<ProductForm
			categories={data.categories}
			error={form?.error ?? null}
			submitLabel="Crear producto"
			values={live}
			onvalues={(values) => (live = { ...values })}
		/>
	</div>
</LivePreviewLayout>
