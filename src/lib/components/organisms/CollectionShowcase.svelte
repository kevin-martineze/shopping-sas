<script lang="ts">
	import type { ProductCard } from '$lib/domain/catalog';

	import { reveal } from '$lib/actions/reveal';
	import ProductGrid from '$lib/components/organisms/ProductGrid.svelte';
	import { formatMoney } from '$lib/utils/money';

	/**
	 * La página de una colección: foto grande con puntos sobre los productos,
	 * nombre y descripción, y la grilla de lo que la compone.
	 *
	 * Vive aquí porque la usan dos rutas: la tienda de verdad y la vista previa
	 * del panel. El borrador llega ya resuelto —nombre, foto y productos—, así
	 * que este componente no sabe si lo que pinta está guardado o no.
	 */
	interface CollectionShowcaseItem {
		product: ProductCard;
		hotspotX: number | null;
		hotspotY: number | null;
	}

	interface Props {
		name: string;
		description: string | null;
		imageUrl: string | null;
		items: CollectionShowcaseItem[];
		/** Solo dentro del editor: marca la cabecera para resaltarla. */
		previewZone?: boolean;
	}

	let { name, description, imageUrl, items, previewZone = false }: Props = $props();

	const products = $derived(items.map((item) => item.product));

	// Solo los productos con posición marcada se etiquetan sobre la foto.
	const hotspots = $derived(
		items.filter((item) => item.hotspotX !== null && item.hotspotY !== null)
	);
</script>

<section class="relative" data-preview-zone={previewZone ? 'collection-header' : undefined}>
	<div class="relative min-h-[75vh] overflow-hidden">
		{#if imageUrl}
			<img
				src={imageUrl}
				alt={name}
				class="absolute inset-0 h-full w-full object-cover"
				fetchpriority="high"
			/>
			<div class="absolute inset-0 bg-black/20"></div>
		{:else}
			<div class="bg-muted absolute inset-0"></div>
		{/if}

		{#each hotspots as item (item.product.id)}
			<a
				href="/tienda/{item.product.slug}"
				class="group absolute -translate-x-1/2 -translate-y-1/2"
				style="left: {item.hotspotX}%; top: {item.hotspotY}%"
				aria-label="Ver {item.product.name}"
			>
				<span class="relative grid size-6 place-items-center">
					<span class="absolute inline-flex size-6 animate-ping rounded-full bg-white/70"></span>
					<span class="relative inline-flex size-3 rounded-full bg-white shadow"></span>
				</span>

				<span
					class="bg-background pointer-events-none absolute top-8 left-1/2 w-max -translate-x-1/2 px-3 py-2 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
				>
					{item.product.name} · {formatMoney(item.product.price)}
				</span>
			</a>
		{/each}
	</div>

	<div class="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6" use:reveal>
		<p class="eyebrow">Colección</p>
		<h1 class="mt-3 text-4xl md:text-6xl">{name}</h1>
		{#if description}
			<p class="text-muted-foreground mx-auto mt-4 max-w-xl text-balance">
				{description}
			</p>
		{/if}
	</div>
</section>

{#if products.length > 0}
	<section class="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
		<h2 class="mb-8 text-2xl">Productos de la colección</h2>
		<ProductGrid {products} />
	</section>
{/if}
