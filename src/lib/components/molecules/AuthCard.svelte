<script lang="ts">
	import type { Snippet } from 'svelte';
	import GloberceMark from '$lib/components/molecules/GloberceMark.svelte';

	interface Props {
		title: string;
		eyebrow?: string;
		/**
		 * Ancho del contenido: el registro necesita bastante más que el login,
		 * porque enseña los tres planes uno al lado del otro y a 672px quedan
		 * tan angostos que no se leen.
		 */
		wide?: boolean;
		children: Snippet;
		footer?: Snippet;
	}

	let { title, eyebrow = 'Globerce', wide = false, children, footer }: Props = $props();
</script>

<!-- La entrada es de Globerce, no del panel: lleva su marca. -->
<main class="marketing grid min-h-screen place-items-center px-4 py-10">
	<div class={wide ? 'w-full max-w-4xl space-y-8' : 'w-full max-w-sm space-y-8'}>
		<header class="space-y-2 text-center">
			<!-- El isotipo lleva a la portada: desde el registro o el login es
			     la salida natural si alguien llegó sin querer. -->
			<a href="/" class="mx-auto mb-4 block w-fit" aria-label="Globerce, inicio">
				<GloberceMark size={44} label="" />
			</a>
			<p class="eyebrow">{eyebrow}</p>
			<h1 class="text-3xl">{title}</h1>
		</header>

		{@render children()}

		{#if footer}
			<p class="text-muted-foreground text-center text-xs">
				{@render footer()}
			</p>
		{/if}
	</div>
</main>
