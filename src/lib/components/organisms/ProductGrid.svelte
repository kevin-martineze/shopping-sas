<script lang="ts">
	import type { ProductCard } from '$lib/domain/catalog';

	import ProductCardItem from '$lib/components/molecules/ProductCardItem.svelte';
	import { reveal } from '$lib/actions/reveal';
	import { cn } from '$lib/utils';

	interface Props {
		products: ProductCard[];
		/** Columnas en escritorio. La grilla siempre arranca en 2 en móvil. */
		columns?: 3 | 4;
		class?: string;
	}

	let { products, columns = 4, class: className }: Props = $props();
</script>

<div
	class={cn(
		'grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6',
		columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
		'md:grid-cols-3',
		className
	)}
>
	{#each products as product, index (product.id)}
		<div use:reveal={{ delay: (index % 4) * 70 }}>
			<ProductCardItem {product} eager={index < 4} />
		</div>
	{/each}
</div>
