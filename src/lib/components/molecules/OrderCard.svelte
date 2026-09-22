<script lang="ts">
	import { cn } from '$lib/utils';

	/**
	 * Un pedido recién llegado, dibujado con HTML.
	 *
	 * Es el momento que vende el producto: alguien compró a las once de la
	 * noche, pagó en línea y el pedido ya está escrito con su total. Se pinta
	 * con los tokens de donde esté —clara sobre lino, oscura sobre pizarra— y
	 * los números cuadran a propósito: $89.900 más $12.000 son $101.900.
	 *
	 * Decorativa: lo que dice ya está en el texto de al lado.
	 */
	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();
</script>

<div
	aria-hidden="true"
	class={cn(
		'bg-card text-card-foreground border-border rounded-lg border p-5 shadow-2xl select-none',
		className
	)}
>
	<div class="flex items-center gap-2">
		<span class="bg-primary size-2 rounded-full"></span>
		<span class="text-sm font-semibold">Pedido nuevo</span>
		<span class="text-muted-foreground ml-auto text-xs tabular-nums">23:41</span>
	</div>

	<p class="mt-4 text-sm">Blusa Vera · talla M · verde ×1</p>
	<p class="text-muted-foreground text-sm">Envío Medellín · $12.000</p>
	<p class="text-primary mt-1 text-sm font-medium">Pagado en línea · Nequi</p>

	<div class="border-border mt-4 flex items-baseline justify-between border-t pt-4">
		<span class="text-sm">Total</span>
		<span class="text-2xl font-semibold tabular-nums">$101.900</span>
	</div>
</div>
