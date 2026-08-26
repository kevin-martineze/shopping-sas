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

	let element = $state<HTMLImageElement | null>(null);
	let loaded = $state(false);
	let failed = $state(false);

	/**
	 * Una imagen ya cacheada termina de cargar antes de que Svelte hidrate, y el
	 * evento `load` se pierde: sin esto la foto se quedaría invisible para
	 * siempre. Al cambiar de foto se vuelve a esperar la nueva.
	 */
	$effect(() => {
		void src;
		failed = false;
		loaded = element?.complete === true && element.naturalWidth > 0;
	});

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

	<!-- Si la foto no carga se deja el fondo liso: mejor eso que el texto roto. -->
	{#if !failed}
		<img
			bind:this={element}
			{src}
			{alt}
			{srcset}
			{sizes}
			loading={eager ? 'eager' : 'lazy'}
			fetchpriority={eager ? 'high' : 'auto'}
			decoding="async"
			onload={() => (loaded = true)}
			onerror={() => (failed = true)}
			class={cn(
				'h-full w-full object-cover transition-opacity duration-700',
				loaded ? 'opacity-100' : 'opacity-0'
			)}
		/>
	{/if}
</div>
