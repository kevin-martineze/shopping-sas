<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		src: string;
		alt: string;
		/** Miniatura base64 que se pinta borrosa mientras carga la real. */
		lqip?: string | null;
		srcset?: string;
		sizes?: string;
		eager?: boolean;
		class?: string;
		ratio?: 'portrait' | 'editorial' | 'square';
	}

	let {
		src,
		alt,
		lqip = null,
		srcset,
		sizes,
		eager = false,
		class: className,
		ratio = 'portrait'
	}: Props = $props();

	let loaded = $state(false);

	const ratioClass = {
		portrait: 'aspect-[3/4]',
		editorial: 'aspect-[4/5]',
		square: 'aspect-square'
	};
</script>

<div class={cn('bg-muted relative overflow-hidden', ratioClass[ratio], className)}>
	{#if lqip}
		<img
			src={lqip}
			alt=""
			aria-hidden="true"
			class={cn(
				'absolute inset-0 h-full w-full scale-105 object-cover blur-xl transition-opacity duration-500',
				loaded ? 'opacity-0' : 'opacity-100'
			)}
		/>
	{/if}

	<img
		{src}
		{alt}
		{srcset}
		{sizes}
		loading={eager ? 'eager' : 'lazy'}
		fetchpriority={eager ? 'high' : 'auto'}
		decoding="async"
		onload={() => (loaded = true)}
		class={cn(
			'h-full w-full object-cover transition-opacity duration-700',
			loaded ? 'opacity-100' : 'opacity-0'
		)}
	/>
</div>
