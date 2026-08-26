<script lang="ts">
	import type { PageData } from './$types';
	import { reveal } from '$lib/actions/reveal';
	import ProductGrid from '$lib/components/organisms/ProductGrid.svelte';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const collection = $derived(data.collection);
	const products = $derived(collection.items.map((item) => item.product));

	// Solo los productos con posición marcada se etiquetan sobre la foto.
	const hotspots = $derived(
		collection.items.filter((item) => item.hotspotX !== null && item.hotspotY !== null)
	);
</script>

<svelte:head>
	<title>{collection.name} — {data.settings.store_name}</title>
	<meta name="description" content={collection.description ?? collection.name} />
</svelte:head>

<section class="relative">
	<div class="relative min-h-[75vh] overflow-hidden">
		{#if collection.hero_image_url}
			<img
				src={collection.hero_image_url}
				alt={collection.name}
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
		<h1 class="mt-3 text-4xl md:text-6xl">{collection.name}</h1>
		{#if collection.description}
			<p class="text-muted-foreground mx-auto mt-4 max-w-xl text-balance">
				{collection.description}
			</p>
		{/if}
	</div>
</section>

{#if products.length > 0}
	<section class="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
		<h2 class="mb-8 text-2xl">Prendas de la colección</h2>
		<ProductGrid {products} />
	</section>
{/if}
