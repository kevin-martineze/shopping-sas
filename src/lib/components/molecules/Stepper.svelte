<script lang="ts">
	import Check from '@lucide/svelte/icons/check';

	import { cn } from '$lib/utils';

	/**
	 * Dónde va y cuánto falta.
	 *
	 * Los pasos ya hechos son botones: quien se equivocó al escribir su correo
	 * quiere volver, no empezar de nuevo. Los que aún no toca no se pueden
	 * saltar, porque cada paso valida lo suyo antes de dejar pasar.
	 */
	interface Props {
		pasos: string[];
		/** Índice del paso en curso, desde 0. */
		actual: number;
		onir?: (indice: number) => void;
	}

	let { pasos, actual, onir }: Props = $props();
</script>

<ol class="flex items-center" aria-label="Progreso del registro">
	{#each pasos as titulo, indice (titulo)}
		{@const hecho = indice < actual}
		{@const activo = indice === actual}

		<li class={cn('flex items-center', indice < pasos.length - 1 && 'flex-1')}>
			<button
				type="button"
				disabled={!hecho}
				onclick={() => onir?.(indice)}
				aria-current={activo ? 'step' : undefined}
				class={cn(
					'flex items-center gap-2 rounded-md text-sm',
					hecho && 'cursor-pointer',
					!activo && !hecho && 'text-muted-foreground'
				)}
			>
				<span
					class={cn(
						'flex size-7 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums transition-colors',
						activo && 'border-foreground bg-foreground text-background',
						hecho && 'border-foreground text-foreground',
						!activo && !hecho && 'border-border'
					)}
				>
					{#if hecho}
						<Check class="size-3.5" />
					{:else}
						{indice + 1}
					{/if}
				</span>

				<!-- El rótulo se esconde en pantallas angostas: el número y la línea
				     ya dicen dónde va, y tres rótulos completos no caben. -->
				<span class={cn('hidden sm:inline', activo && 'font-medium')}>{titulo}</span>
			</button>

			{#if indice < pasos.length - 1}
				<span
					class={cn('mx-3 h-px flex-1 transition-colors', hecho ? 'bg-foreground' : 'bg-border')}
				></span>
			{/if}
		</li>
	{/each}
</ol>
