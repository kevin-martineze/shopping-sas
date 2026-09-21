<script lang="ts">
	import type { StorefrontTemplate } from '$lib/domain/templates';

	/**
	 * Una tienda dibujada con la plantilla que se está eligiendo.
	 *
	 * Es la vitrina de verdad en miniatura, no una captura: hereda los mismos
	 * tokens que `app.css` define para cada plantilla, así que si cambia el
	 * diseño de la tienda cambia también esta muestra, sin volver a exportar
	 * ninguna imagen.
	 *
	 * Decorativa: lo que dice ya está escrito al lado.
	 */
	interface Props {
		template: StorefrontTemplate;
		storeName: string;
	}

	let { template, storeName }: Props = $props();

	const productos = [
		{ nombre: 'Blusa Vera', precio: '$89.900', tono: 'oklch(0.86 0.02 60)' },
		{ nombre: 'Café Huila', precio: '$38.000', tono: 'oklch(0.78 0.04 40)' },
		{ nombre: 'Vela Romero', precio: '$52.000', tono: 'oklch(0.72 0.05 25)' }
	];
</script>

<div
	data-storefront-template={template}
	aria-hidden="true"
	class="bg-background text-foreground border-border overflow-hidden border select-none"
>
	<div class="border-border flex items-center justify-between border-b px-4 py-2.5">
		<span class="font-display truncate text-sm">{storeName}</span>
		<span class="text-muted-foreground flex gap-3 text-[10px] tracking-[0.14em] uppercase">
			<span>Tienda</span>
			<span>Colecciones</span>
		</span>
	</div>

	{#if template === 'boutique'}
		<!-- Misma altura que el hero de la otra plantilla: las dos muestras se
		     comparan de un vistazo y no una encima de la otra. -->
		<div class="bg-secondary/50 grid h-28 grid-cols-2 items-center gap-4 px-4">
			<div class="space-y-1.5">
				<p class="text-muted-foreground text-[9px] tracking-[0.18em] uppercase">Nueva temporada</p>
				<p class="text-base leading-tight font-semibold tracking-tight">Ropa para todos los días</p>
				<span
					class="bg-primary text-primary-foreground inline-block rounded-[calc(var(--radius)/2)] px-3 py-1 text-[10px]"
				>
					Ver la tienda
				</span>
			</div>
			<div
				class="h-[5.5rem] w-full rounded-[calc(var(--radius)/1.5)]"
				style="background-color: oklch(0.8 0.04 45)"
			></div>
		</div>
	{:else}
		<div class="relative h-28 w-full" style="background-color: oklch(0.55 0.02 60)">
			<div class="absolute inset-0 flex flex-col justify-end gap-1.5 p-4">
				<p class="text-[9px] tracking-[0.18em] text-white/75 uppercase">Nueva temporada</p>
				<p class="font-display text-xl leading-none text-white">Ropa para todos los días</p>
				<span class="mt-1 inline-block w-fit bg-white px-3 py-1 text-[10px] text-black">
					Ver la tienda
				</span>
			</div>
		</div>
	{/if}

	<div class="grid grid-cols-3 gap-3 px-4 py-4">
		{#each productos as producto (producto.nombre)}
			<div>
				<div
					class="aspect-[3/4] w-full rounded-[calc(var(--radius)/2)]"
					style={`background-color: ${producto.tono}`}
				></div>
				<p class="mt-1.5 truncate text-[10px]">{producto.nombre}</p>
				<p class="text-muted-foreground text-[10px]">{producto.precio}</p>
			</div>
		{/each}
	</div>
</div>
