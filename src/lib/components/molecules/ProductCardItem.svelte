<script lang="ts">
	import type { ProductCard } from '$lib/domain/catalog';

	import Heart from '@lucide/svelte/icons/heart';

	import ProductImage from '$lib/components/molecules/ProductImage.svelte';
	import PriceTag from '$lib/components/molecules/PriceTag.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { cn } from '$lib/utils';
	import { discountPercent } from '$lib/utils/money';

	interface Props {
		product: ProductCard;
		eager?: boolean;
	}

	let { product, eager = false }: Props = $props();

	const primary = $derived(product.images.at(0));
	const secondary = $derived(product.images.at(1));
	const isFavorite = $derived(favorites.has(product.slug));
	const percent = $derived(discountPercent(product.price, product.compareAtPrice));
</script>

<article class="group relative">
	<a href="/tienda/{product.slug}" class="block focus-visible:outline-none">
		<div
			class="relative overflow-hidden"
			style="view-transition-name: prenda-{product.slug.replace(/[^a-z0-9]/g, '-')}"
		>
			{#if primary}
				<ProductImage
					src={primary.url_card}
					srcset="{primary.url_thumb} 400w, {primary.url_card} 800w"
					sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
					alt={primary.alt ?? product.name}
					lqip={primary.lqip}
					{eager}
					class="transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
				/>
			{:else}
				<div class="bg-muted aspect-[3/4]"></div>
			{/if}

			{#if secondary}
				<!-- Segunda foto: aparece en hover, sin mover el layout. -->
				<div
					class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-[var(--ease-editorial)] group-hover:opacity-100"
				>
					<ProductImage src={secondary.url_card} alt="" lqip={secondary.lqip} class="h-full" />
				</div>
			{/if}

			{#if !product.inStock}
				<span
					class="bg-background/90 text-foreground absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] tracking-wide uppercase"
				>
					Agotado
				</span>
			{:else if percent !== null}
				<span
					class="bg-sale text-sale-foreground absolute top-3 left-3 rounded-full px-3 py-1 text-[11px] font-medium tracking-wide"
				>
					-{percent}%
				</span>
			{/if}

			<!-- Aparece al pasar el cursor: invita a entrar sin tapar la foto. -->
			<div
				class="pointer-events-none absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition-all duration-500 ease-[var(--ease-editorial)] group-hover:translate-y-0 group-hover:opacity-100"
			>
				<span
					class="bg-background/95 text-foreground block rounded-full px-4 py-2 text-center text-xs font-medium backdrop-blur"
				>
					Ver prenda
				</span>
			</div>
		</div>

		<div class="mt-3 space-y-1">
			<h3 class="font-sans text-sm font-medium tracking-tight">{product.name}</h3>
			<PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="sm" />
		</div>
	</a>

	<div class="mt-2 flex items-center gap-1.5">
		{#each product.colors as color (color.id)}
			<span
				class="border-border size-3 rounded-full border"
				style="background-color: {color.hex}"
				title={color.name}
			></span>
		{/each}
	</div>

	<button
		type="button"
		onclick={() => favorites.toggle(product.slug)}
		aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
		aria-pressed={isFavorite}
		class="bg-background/80 hover:bg-background absolute top-3 right-3 grid size-8 place-items-center backdrop-blur transition-colors"
	>
		<Heart class={cn('size-4', isFavorite && 'fill-foreground')} />
	</button>
</article>
