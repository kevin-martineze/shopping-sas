<script lang="ts">
	import type { ProductImage as ProductImageType } from '$lib/domain/catalog';

	import ProductImage from '$lib/components/molecules/ProductImage.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		images: ProductImageType[];
		productName: string;
		/** Al elegir color se salta a la primera foto de ese color. */
		activeColorId: string | null;
	}

	let { images, productName, activeColorId }: Props = $props();

	// Fotos del color elegido; si ese color no tiene fotos propias, se muestran todas.
	const visible = $derived.by(() => {
		if (!activeColorId) return images;

		const filtered = images.filter((image) => image.color_id === activeColorId);
		return filtered.length > 0 ? filtered : images;
	});

	let selected = $state(0);

	// Al cambiar el set de fotos volvemos a la primera para no quedar fuera de rango.
	$effect(() => {
		void visible;
		selected = 0;
	});

	const current = $derived(visible.at(selected) ?? visible.at(0) ?? null);
</script>

<div class="grid gap-4 md:grid-cols-[auto_1fr]">
	{#if visible.length > 1}
		<div class="order-2 flex gap-2 overflow-x-auto md:order-1 md:flex-col md:overflow-visible">
			{#each visible as image, index (image.id)}
				<button
					type="button"
					onclick={() => (selected = index)}
					aria-label="Ver foto {index + 1}"
					aria-current={index === selected}
					class={cn(
						'w-16 flex-none border transition-colors md:w-20',
						index === selected ? 'border-foreground' : 'border-transparent hover:border-border'
					)}
				>
					<ProductImage src={image.url_thumb} alt="" lqip={image.lqip} ratio="portrait" />
				</button>
			{/each}
		</div>
	{/if}

	<div class="order-1 md:order-2">
		{#if current}
			<ProductImage
				src={current.url_full}
				srcset="{current.url_card} 800w, {current.url_full} 1600w"
				sizes="(min-width: 1024px) 45vw, 100vw"
				alt={current.alt ?? productName}
				lqip={current.lqip}
				eager
				ratio="portrait"
			/>
		{:else}
			<div class="bg-muted aspect-[3/4]"></div>
		{/if}
	</div>
</div>
