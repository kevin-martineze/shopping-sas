<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';

	import { cn } from '$lib/utils';

	interface Props {
		/** Lo que se copia al portapapeles. */
		value: string;
		/** Texto accesible: qué se copia. */
		label: string;
		class?: string;
	}

	let { value, label, class: className }: Props = $props();

	let copiado = $state(false);

	async function copiar() {
		try {
			await navigator.clipboard.writeText(value);
			copiado = true;
			setTimeout(() => (copiado = false), 1500);
		} catch (cause) {
			console.warn('No se pudo copiar al portapapeles.', cause);
		}
	}
</script>

<button
	type="button"
	class={cn(
		'text-muted-foreground hover:text-foreground inline-grid size-7 place-items-center rounded-md',
		className
	)}
	aria-label={`Copiar ${label}`}
	title={`Copiar ${label}`}
	onclick={copiar}
>
	{#if copiado}
		<Check class="size-3.5 text-success" />
	{:else}
		<Copy class="size-3.5" />
	{/if}
</button>
