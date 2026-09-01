<script lang="ts">
	import type { Collection } from '$lib/domain/settings';

	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	import { parallax } from '$lib/actions/parallax';
	import { reveal } from '$lib/actions/reveal';
	import { cn } from '$lib/utils';

	interface Props {
		collection: Collection;
		/** Número que se pinta grande sobre la foto. */
		index: string;
		/** Alterna el lado de la foto para que la lista no sea una columna. */
		flipped?: boolean;
	}

	let { collection, index, flipped = false }: Props = $props();
</script>

<a
	href="/colecciones/{collection.slug}"
	class="group grid items-center gap-6 md:grid-cols-12 md:gap-12"
	use:reveal
>
	<div
		class={cn(
			'relative aspect-[4/5] overflow-hidden md:col-span-7 md:aspect-[16/11]',
			flipped && 'md:order-2'
		)}
	>
		{#if collection.hero_image_url}
			<!-- Más alta que su marco: el parallax se mueve dentro del recorte. -->
			<img
				src={collection.hero_image_url}
				alt=""
				loading="lazy"
				class="absolute -top-[8%] left-0 h-[116%] w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.02]"
				use:parallax={{ amount: 0.12, from: 'element' }}
			/>
		{:else}
			<div class="bg-muted absolute inset-0"></div>
		{/if}
	</div>

	<div class={cn('space-y-4 md:col-span-5', flipped && 'md:order-1')}>
		<p class="eyebrow flex items-center gap-3">
			<span class="text-muted-foreground tabular-nums">{index}</span>
			<span>Colección</span>
		</p>
		<h3 class="text-3xl leading-[1.05] text-balance md:text-4xl">{collection.name}</h3>

		{#if collection.description}
			<p class="text-muted-foreground max-w-sm text-sm leading-relaxed">
				{collection.description}
			</p>
		{/if}

		<span class="inline-flex items-center gap-2 text-sm font-medium">
			Ver la colección
			<ArrowRight class="size-4 transition-transform group-hover:translate-x-1" />
		</span>
	</div>
</a>
