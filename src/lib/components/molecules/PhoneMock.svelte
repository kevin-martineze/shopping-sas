<script lang="ts">
	import Boxes from '@lucide/svelte/icons/boxes';
	import Package from '@lucide/svelte/icons/package';
	import Receipt from '@lucide/svelte/icons/receipt';

	import GloberceMark from '$lib/components/molecules/GloberceMark.svelte';
	import { cn } from '$lib/utils';

	/**
	 * El panel de Globerce en un celular, dibujado con HTML.
	 *
	 * Es una maqueta y no una captura por lo mismo que `StorefrontMock`: no
	 * envejece, no pesa y se ve nítida en cualquier pantalla. Lleva los tokens
	 * oscuros del panel —«panel oscuro, tienda clara»—, así que se pone dentro
	 * de una banda `.marketing-dark` y hereda la pizarra sin pedir nada.
	 *
	 * Decorativa: el texto de al lado cuenta lo que aquí se ve.
	 */
	interface Props {
		class?: string;
	}

	let { class: className }: Props = $props();

	const pedidos = [
		{ numero: '#1047', detalle: 'Blusa Vera · M · verde', total: '$101.900', estado: 'pagado' },
		{ numero: '#1046', detalle: 'Café Huila · fina · 500 g', total: '$50.000', estado: 'enviado' },
		{ numero: '#1045', detalle: 'Vela Romero ×2', total: '$104.000', estado: 'pagado' },
		{ numero: '#1044', detalle: 'Cuaderno Ruta', total: '$46.900', estado: 'espera' }
	] as const;

	const ETIQUETA = { pagado: 'Pagado', enviado: 'Enviado', espera: 'Por confirmar' } as const;
</script>

<div
	aria-hidden="true"
	class={cn(
		'bg-card ring-border w-[290px] rounded-[2.75rem] p-2.5 shadow-2xl ring-1 select-none',
		className
	)}
>
	<div class="bg-background overflow-hidden rounded-[2.1rem]">
		<!-- Barra de estado: sitúa el celular sin dibujar un celular entero. -->
		<div class="flex items-center justify-between px-6 pt-3 text-[11px] font-semibold tabular-nums">
			<span>9:41</span>
			<span class="bg-card h-5 w-20 rounded-full"></span>
			<span class="flex gap-0.5">
				<span class="bg-foreground/70 h-2.5 w-1 rounded-sm"></span>
				<span class="bg-foreground/70 h-2.5 w-1 rounded-sm"></span>
				<span class="bg-foreground/40 h-2.5 w-1 rounded-sm"></span>
			</span>
		</div>

		<div class="px-5 pt-6 pb-4">
			<div class="flex items-center gap-2">
				<GloberceMark size={24} label="" />
				<span class="text-muted-foreground text-xs">Mariposa</span>
			</div>
			<p class="mt-4 text-xl font-semibold">Pedidos</p>
			<p class="text-muted-foreground text-xs">Hoy · 4 nuevos</p>
		</div>

		<ul class="divide-border divide-y px-5">
			{#each pedidos as pedido (pedido.numero)}
				<li class="flex items-center gap-3 py-3">
					<div class="min-w-0 flex-1">
						<p class="flex items-baseline gap-2 text-sm">
							<span class="text-muted-foreground text-xs tabular-nums">{pedido.numero}</span>
							<span class="truncate">{pedido.detalle}</span>
						</p>
						<p class="mt-0.5 text-sm font-semibold tabular-nums">{pedido.total}</p>
					</div>
					<span
						class={cn(
							'rounded-full px-2 py-0.5 text-[10px] font-semibold',
							pedido.estado === 'pagado' && 'bg-primary/15 text-primary',
							pedido.estado === 'enviado' && 'bg-card text-muted-foreground',
							pedido.estado === 'espera' && 'bg-caution/15 text-caution'
						)}
					>
						{ETIQUETA[pedido.estado]}
					</span>
				</li>
			{/each}
		</ul>

		<!-- La barra de abajo: tres módulos, el activo en teal. -->
		<div class="border-border mt-2 grid grid-cols-3 border-t px-4 py-3 text-[10px] font-medium">
			<span class="text-primary flex flex-col items-center gap-1">
				<Receipt class="size-4" />
				Pedidos
			</span>
			<span class="text-muted-foreground flex flex-col items-center gap-1">
				<Package class="size-4" />
				Productos
			</span>
			<span class="text-muted-foreground flex flex-col items-center gap-1">
				<Boxes class="size-4" />
				Inventario
			</span>
		</div>
	</div>
</div>
