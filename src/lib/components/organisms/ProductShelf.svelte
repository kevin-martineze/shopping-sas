<script lang="ts">
	import type { ProductCard } from '$lib/domain/catalog';

	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	import { Button } from '$lib/components/atoms/button';
	import ProductCardItem from '$lib/components/molecules/ProductCardItem.svelte';

	interface Props {
		products: ProductCard[];
		/** Lo que anuncia el lector de pantalla al entrar al carrusel. */
		label: string;
	}

	let { products, label }: Props = $props();

	let track = $state<HTMLDivElement | null>(null);

	/** Avanza o retrocede una pantalla entera, con un poco de solape para no perder la referencia. */
	function scrollByPage(direction: 1 | -1) {
		if (!track) return;

		track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
	}
</script>

<section class="relative" aria-label={label}>
	<!-- Se desliza con el dedo; en computador, las flechas de abajo. -->
	<div
		bind:this={track}
		class="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 sm:gap-6"
	>
		{#each products as product (product.id)}
			<div class="w-[46%] shrink-0 snap-start lg:w-[23%] xl:w-[19%]">
				<ProductCardItem {product} />
			</div>
		{/each}
	</div>

	<!-- Las flechas solo en computador: en celular se desliza. -->
	<div class="mt-4 hidden justify-end gap-2 lg:flex">
		<Button
			type="button"
			variant="outline"
			size="icon"
			aria-label="Ver anteriores"
			onclick={() => scrollByPage(-1)}
		>
			<ChevronLeft class="size-4" />
		</Button>
		<Button
			type="button"
			variant="outline"
			size="icon"
			aria-label="Ver siguientes"
			onclick={() => scrollByPage(1)}
		>
			<ChevronRight class="size-4" />
		</Button>
	</div>
</section>
