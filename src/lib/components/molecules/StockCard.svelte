<script lang="ts">
	import { cn } from '$lib/utils';

	/**
	 * La ficha de inventario de una variación, dibujada con HTML: cuántas
	 * quedan y qué tallas hay. La L agotada va en terracota, que es el color
	 * del kit para «queda poco, alguien espera»; la M elegida, en teal.
	 *
	 * Decorativa, como las demás fichas del sitio comercial.
	 */
	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();

	const tallas = [
		{ nombre: 'S', estado: 'libre' },
		{ nombre: 'M', estado: 'elegida' },
		{ nombre: 'L', estado: 'agotada' },
		{ nombre: 'XL', estado: 'libre' }
	] as const;
</script>

<div
	aria-hidden="true"
	class={cn(
		'bg-card text-card-foreground border-border rounded-lg border p-5 shadow-2xl select-none',
		className
	)}
>
	<p class="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">Inventario</p>
	<p class="mt-2 font-semibold">Blusa Vera · verde</p>

	<div class="mt-3 flex items-baseline gap-2">
		<span class="text-primary text-4xl font-semibold tabular-nums">3</span>
		<span class="text-muted-foreground text-sm">quedan en talla M</span>
	</div>

	<ul class="mt-4 flex flex-wrap gap-1.5">
		{#each tallas as talla (talla.nombre)}
			<li
				class={cn(
					'rounded-full border px-3 py-1 text-xs font-medium',
					talla.estado === 'elegida' && 'border-primary bg-primary text-primary-foreground',
					talla.estado === 'agotada' && 'border-caution text-caution line-through',
					talla.estado === 'libre' && 'border-border text-muted-foreground'
				)}
			>
				{talla.nombre}
			</li>
		{/each}
	</ul>
</div>
