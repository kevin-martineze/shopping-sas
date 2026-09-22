<script lang="ts">
	import { cn } from '$lib/utils';

	/**
	 * La pantalla de pago de una tienda, dibujada con HTML: el resumen, los
	 * medios que acepta y el pago aprobado. Los medios se nombran con
	 * palabras, sin logos ni el verde de nadie: regla del kit. Los números
	 * cuadran con los de `OrderCard`.
	 *
	 * Decorativa, como las demás fichas del sitio comercial.
	 */
	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();

	const lineas = [
		{ concepto: 'Blusa Vera · M · verde', valor: '$89.900' },
		{ concepto: 'Envío Medellín', valor: '$12.000' }
	];

	const medios = ['Tarjeta', 'PSE', 'Nequi'];
</script>

<div
	aria-hidden="true"
	class={cn(
		'bg-card text-card-foreground border-border rounded-lg border p-5 shadow-2xl select-none',
		className
	)}
>
	<div class="flex items-center gap-2 text-sm font-semibold">
		<span class="bg-primary size-2 rounded-full"></span>
		Mariposa · Pago seguro
	</div>

	<dl class="mt-4 space-y-2 text-sm">
		{#each lineas as linea (linea.concepto)}
			<div class="flex items-baseline justify-between gap-4">
				<dt class="text-muted-foreground">{linea.concepto}</dt>
				<dd class="tabular-nums">{linea.valor}</dd>
			</div>
		{/each}
		<div class="border-border flex items-baseline justify-between gap-4 border-t pt-2">
			<dt class="font-medium">Total</dt>
			<dd class="text-primary text-lg font-semibold tabular-nums">$101.900</dd>
		</div>
	</dl>

	<ul class="mt-4 flex gap-1.5">
		{#each medios as medio (medio)}
			<li
				class="border-border text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium"
			>
				{medio}
			</li>
		{/each}
	</ul>

	<p
		class="bg-primary text-primary-foreground mt-4 rounded-full py-2 text-center text-sm font-semibold"
	>
		Pago aprobado
	</p>
</div>
