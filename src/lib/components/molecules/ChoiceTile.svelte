<script lang="ts">
	import type { Snippet } from 'svelte';

	import { cn } from '$lib/utils';

	/**
	 * Una opción de un grupo, con forma de tarjeta.
	 *
	 * Igual que en `PlanOption`, el radio de verdad queda oculto pero presente:
	 * el formulario funciona sin JavaScript y el teclado recorre el grupo como
	 * cualquier otro. Lo de arriba (`preview`) es para enseñar la opción, no
	 * para describirla: lo que se lee es `label` y `hint`.
	 */
	interface Props {
		name: string;
		value: string;
		group: string;
		label: string;
		hint?: string;
		preview?: Snippet;
		class?: string;
	}

	let {
		name,
		value,
		group = $bindable(),
		label,
		hint,
		preview,
		class: className
	}: Props = $props();

	const elegida = $derived(group === value);
</script>

<label class={cn('relative block h-full', className)}>
	<input type="radio" {name} {value} bind:group class="peer sr-only" />

	<span
		class={cn(
			'border-border bg-background flex h-full cursor-pointer flex-col gap-2 rounded-lg border p-3 transition-colors',
			'peer-focus-visible:ring-ring peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
			elegida ? 'border-foreground bg-muted/40' : 'hover:border-foreground/40'
		)}
	>
		{#if preview}
			{@render preview()}
		{/if}

		<span class="text-sm font-medium">{label}</span>

		{#if hint}
			<span class="text-muted-foreground text-xs leading-snug">{hint}</span>
		{/if}
	</span>
</label>
