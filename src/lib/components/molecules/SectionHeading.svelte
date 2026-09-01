<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	import { reveal } from '$lib/actions/reveal';

	interface Props {
		/** Número de sección: da ritmo de revista a la portada. */
		index?: string;
		eyebrow: string;
		title: string;
		href?: string;
		linkLabel?: string;
	}

	let { index, eyebrow, title, href, linkLabel = 'Ver todo' }: Props = $props();
</script>

<div class="border-border mb-10 flex items-end justify-between gap-4 border-t pt-6" use:reveal>
	<div class="space-y-3">
		<p class="eyebrow flex items-center gap-3">
			{#if index}
				<span class="text-muted-foreground tabular-nums">{index}</span>
			{/if}
			<span>{eyebrow}</span>
		</p>

		<h2 class="text-3xl leading-[1.05] text-balance md:text-5xl">{title}</h2>
	</div>

	{#if href}
		<a
			{href}
			class="hover:text-foreground text-muted-foreground group hidden shrink-0 items-center gap-2 pb-2 text-sm sm:flex"
		>
			{linkLabel}
			<ArrowRight class="size-4 transition-transform group-hover:translate-x-1" />
		</a>
	{/if}
</div>
