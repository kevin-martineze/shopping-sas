<script lang="ts">
	import { cn } from '$lib/utils';

	/**
	 * La ficha de un producto en la tienda, según cómo se divida.
	 *
	 * Es la demostración de lo que distingue al catálogo: cada rubro declara
	 * sus ejes y la ficha se acomoda. Ropa: talla y color, con una talla
	 * agotada. Café: molienda y peso, con precio por presentación. Pieza única:
	 * ningún eje y una sola existencia. Los tonos de la foto y las muestras de
	 * color son contenido —el producto—, no interfaz, por eso van en línea.
	 *
	 * Decorativa: el texto de al lado dice lo mismo con palabras.
	 */
	export type Rubro = 'ropa' | 'cafe' | 'unico';

	interface Props {
		rubro: Rubro;
		class?: string;
	}

	let { rubro, class: className }: Props = $props();

	const fichas = {
		ropa: {
			nombre: 'Blusa Vera',
			precio: '$89.900',
			tono: 'oklch(0.86 0.02 60)',
			nota: 'Quedan 3 en talla M',
			ejes: [
				{
					nombre: 'Talla',
					opciones: [
						{ valor: 'S', estado: 'libre' },
						{ valor: 'M', estado: 'elegida' },
						{ valor: 'L', estado: 'agotada' },
						{ valor: 'XL', estado: 'libre' }
					]
				},
				{
					nombre: 'Color',
					opciones: [
						{ valor: 'Verde', estado: 'elegida', tono: 'oklch(0.55 0.08 160)' },
						{ valor: 'Arena', estado: 'libre', tono: 'oklch(0.82 0.04 80)' },
						{ valor: 'Negro', estado: 'libre', tono: 'oklch(0.25 0.01 60)' }
					]
				}
			]
		},
		cafe: {
			nombre: 'Café Huila',
			precio: '$38.000',
			tono: 'oklch(0.78 0.04 40)',
			nota: '500 g · molienda fina',
			ejes: [
				{
					nombre: 'Molienda',
					opciones: [
						{ valor: 'Grano', estado: 'libre' },
						{ valor: 'Fina', estado: 'elegida' },
						{ valor: 'Media', estado: 'libre' }
					]
				},
				{
					nombre: 'Peso',
					opciones: [
						{ valor: '250 g', estado: 'libre' },
						{ valor: '500 g', estado: 'elegida' },
						{ valor: '1 kg', estado: 'libre' }
					]
				}
			]
		},
		unico: {
			nombre: 'Atlas de la Sierra',
			precio: '$64.000',
			tono: 'oklch(0.72 0.05 25)',
			nota: 'Pieza única · 1 disponible',
			ejes: []
		}
	} as const;

	const ficha = $derived(fichas[rubro]);
</script>

<div
	aria-hidden="true"
	class={cn(
		'bg-card text-card-foreground border-border w-full max-w-xs rounded-lg border p-4 shadow-2xl select-none',
		className
	)}
>
	<div
		class="aspect-[4/3] w-full rounded-[calc(var(--radius)-6px)]"
		style="background-color: {ficha.tono}"
	></div>

	<div class="mt-4 flex items-baseline justify-between gap-3">
		<p class="font-semibold">{ficha.nombre}</p>
		<p class="text-primary font-semibold tabular-nums">{ficha.precio}</p>
	</div>

	{#each ficha.ejes as eje (eje.nombre)}
		<div class="mt-4">
			<p class="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
				{eje.nombre}
			</p>
			<ul class="mt-2 flex flex-wrap gap-1.5">
				{#each eje.opciones as opcion (opcion.valor)}
					<li
						class={cn(
							'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
							opcion.estado === 'elegida' && 'border-primary bg-primary text-primary-foreground',
							opcion.estado === 'agotada' && 'border-caution text-caution line-through',
							opcion.estado === 'libre' && 'border-border text-muted-foreground'
						)}
					>
						{#if 'tono' in opcion}
							<span class="size-2.5 rounded-full" style="background-color: {opcion.tono}"></span>
						{/if}
						{opcion.valor}
					</li>
				{/each}
			</ul>
		</div>
	{/each}

	<p class="text-muted-foreground mt-4 text-xs">{ficha.nota}</p>

	<p
		class="bg-foreground text-background mt-3 rounded-full py-2.5 text-center text-sm font-semibold"
	>
		Añadir al carrito
	</p>
</div>
