<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		eyebrow?: string;
		/** Ancho del contenido: el registro, con sus dos columnas, necesita más que el login. */
		wide?: boolean;
		children: Snippet;
		footer?: Snippet;
	}

	let { title, eyebrow = 'Globerce', wide = false, children, footer }: Props = $props();
</script>

<main class="admin-shell grid min-h-screen place-items-center px-4 py-10">
	<div class={wide ? 'w-full max-w-2xl space-y-8' : 'w-full max-w-sm space-y-8'}>
		<header class="space-y-2 text-center">
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
