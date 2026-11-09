<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		/** Nombre de la tienda: el texto si no hay logo, y el `alt` del logo. */
		name: string;
		logoUrl: string | null;
		/** Tamaño del logo. El texto hereda la tipografía de quien lo contiene. */
		class?: string;
	}

	let { name, logoUrl, class: className }: Props = $props();
</script>

{#if logoUrl}
	<img
		src={logoUrl}
		alt={name}
		class={cn('h-8 w-auto max-w-48 object-contain md:h-10', className)}
	/>
{:else}
	{name}
{/if}
