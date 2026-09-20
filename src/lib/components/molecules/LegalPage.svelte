<script lang="ts">
	import type { Snippet } from 'svelte';
	import { EMPRESA, VIGENCIA_LEGAL } from '$lib/config/empresa';

	/**
	 * El marco de las páginas legales: mismo ancho de lectura, misma cabecera y
	 * el mismo pie para volver. Lo que cambia es el texto.
	 */
	interface Props {
		title: string;
		summary: string;
		children: Snippet;
	}

	let { title, summary, children }: Props = $props();
</script>

<div class="marketing bg-background min-h-screen">
	<header class="border-border border-b">
		<div class="mx-auto flex max-w-3xl items-center justify-between gap-6 px-4 py-4 sm:px-6">
			<a href="/" class="font-display text-xl tracking-tight">{EMPRESA.marca}</a>
			<a href="/" class="text-muted-foreground hover:text-foreground text-sm">Volver al inicio</a>
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-4 py-14 sm:px-6">
		<h1 class="text-4xl">{title}</h1>
		<p class="text-muted-foreground mt-3">{summary}</p>
		<p class="text-muted-foreground mt-1 text-sm">En vigor desde el {VIGENCIA_LEGAL}.</p>

		<div class="legal mt-10 space-y-8">
			{@render children()}
		</div>
	</main>
</div>

<style>
	/* Ritmo de lectura largo: los títulos respiran y los párrafos no se pegan. */
	.legal :global(h2) {
		font-size: 1.25rem;
		margin-bottom: 0.5rem;
	}

	.legal :global(p),
	.legal :global(li) {
		color: var(--muted-foreground);
		line-height: 1.7;
	}

	.legal :global(p + p) {
		margin-top: 0.75rem;
	}

	.legal :global(ul) {
		list-style: disc;
		padding-left: 1.25rem;
		margin-top: 0.5rem;
	}

	.legal :global(li + li) {
		margin-top: 0.35rem;
	}

	.legal :global(a) {
		text-decoration: underline;
		text-underline-offset: 4px;
	}
</style>
