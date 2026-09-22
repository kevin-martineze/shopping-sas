<script lang="ts">
	/**
	 * Una tienda de Globerce, dibujada con HTML.
	 *
	 * Es una maqueta y no una captura a propósito: una captura envejece con
	 * cada cambio del producto, pesa, y se ve borrosa en pantallas densas. Esto
	 * se ve nítido en cualquier tamaño y hereda los colores de la marca.
	 *
	 * Decorativa: `aria-hidden`, porque lo que dice ya está en el texto de al
	 * lado y para quien no ve la pantalla solo sería ruido.
	 */
	const productos = [
		{ nombre: 'Blusa Vera', precio: '$89.900', tono: 'oklch(0.86 0.02 60)' },
		{ nombre: 'Café Huila', precio: '$38.000', tono: 'oklch(0.78 0.04 40)' },
		{ nombre: 'Vela Romero', precio: '$52.000', tono: 'oklch(0.82 0.03 120)' },
		{ nombre: 'Cuaderno Ruta', precio: '$34.900', tono: 'oklch(0.72 0.05 25)' }
	];
</script>

<!-- Es una tienda: lleva los tokens claros aunque se pinte en el panel oscuro. -->
<div aria-hidden="true" class="select-none" data-storefront-template="editorial">
	<div class="border-border bg-background overflow-hidden rounded-lg border shadow-xl">
		<!-- Barra del navegador: sitúa la maqueta sin decir "esto es un navegador". -->
		<div class="border-border bg-muted/60 flex items-center gap-2 border-b px-3 py-2">
			<span class="bg-muted-foreground/30 size-2 rounded-full"></span>
			<span class="bg-muted-foreground/30 size-2 rounded-full"></span>
			<span class="bg-muted-foreground/30 size-2 rounded-full"></span>
			<span
				class="bg-background text-muted-foreground ml-2 flex-1 truncate px-2 py-0.5 text-[10px]"
			>
				mariposa.globerce.store
			</span>
		</div>

		<div class="px-4 py-4">
			<div class="mb-3 flex items-baseline justify-between">
				<span class="font-display text-base">Tienda Mariposa</span>
				<span class="text-muted-foreground text-[10px] tracking-[0.18em] uppercase">Nuevo</span>
			</div>

			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{#each productos as producto (producto.nombre)}
					<div>
						<div class="aspect-[3/4] w-full" style={`background-color: ${producto.tono}`}></div>
						<p class="mt-1.5 truncate text-[11px]">{producto.nombre}</p>
						<p class="text-muted-foreground font-mono text-[11px]">{producto.precio}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- El pedido que llega por WhatsApp: es el momento que vende el producto.
	     Va debajo y no flotando encima: ahí taparía justo los nombres de las
	     productos, que es lo que la maqueta tiene que mostrar. -->
	<div
		class="border-border bg-background ml-auto -mt-3 w-56 rounded-lg border p-3 shadow-lg sm:-mr-6"
	>
		<p class="text-muted-foreground text-[10px] tracking-[0.18em] uppercase">Pedido nuevo</p>
		<p class="mt-1 text-sm">Café Huila · Molienda fina · 500 g</p>
		<p class="text-muted-foreground text-xs">Envío Medellín · $12.000</p>
		<p class="mt-2 font-mono text-lg font-medium tabular-nums">$50.000</p>
	</div>
</div>
