<script lang="ts">
	import { cn } from '$lib/utils';

	/**
	 * Los iconos de módulo del brandkit: ocho formas geométricas sobre una
	 * pastilla de 60 px, radio 16, trazo de 2.5 px y un solo acento por icono.
	 *
	 * En el kit estaban dibujados con divs; aquí son SVG sobre el mismo espacio
	 * de 60×60, con las mismas medidas. El color sale de `currentColor`, así
	 * que lo pone el token del tono y no un hex escrito en el componente.
	 *
	 * Los tonos siguen al kit: teal para lo que es operación normal, terracota
	 * para lo que pide atención —un cupón que vence, alguien que espera—.
	 */
	export type ModuleName =
		| 'catalogo'
		| 'inventario'
		| 'pedidos'
		| 'cupones'
		| 'envios'
		| 'colecciones'
		| 'avisos'
		| 'equipo';

	interface Props {
		name: ModuleName;
		class?: string;
	}

	let { name, class: className }: Props = $props();

	const atencion = $derived(name === 'cupones' || name === 'avisos');
</script>

<span
	class={cn(
		'inline-grid size-15 shrink-0 place-items-center rounded-2xl',
		atencion ? 'bg-caution/12 text-caution' : 'bg-primary/10 text-primary',
		className
	)}
	aria-hidden="true"
>
	<svg viewBox="0 0 60 60" class="size-15" fill="none">
		{#if name === 'catalogo'}
			<!-- Cuatro celdas: las diagonales en color pleno. -->
			<rect x="17" y="17" width="10.5" height="10.5" rx="3" fill="currentColor" />
			<rect x="32.5" y="17" width="10.5" height="10.5" rx="3" fill="currentColor" opacity="0.42" />
			<rect x="17" y="32.5" width="10.5" height="10.5" rx="3" fill="currentColor" opacity="0.42" />
			<rect x="32.5" y="32.5" width="10.5" height="10.5" rx="3" fill="currentColor" />
		{:else if name === 'inventario'}
			<!-- Tres barras que se acortan: lo que queda. -->
			<rect x="17" y="16" width="26" height="6" rx="3" fill="currentColor" />
			<rect x="17" y="27" width="17.2" height="6" rx="3" fill="currentColor" opacity="0.55" />
			<rect x="17" y="38" width="9.4" height="6" rx="3" fill="currentColor" opacity="0.3" />
		{:else if name === 'pedidos'}
			<!-- Un globo de mensaje con dos renglones: el pedido llega escrito. -->
			<path
				d="M 24 20.25 H 36 A 5.75 5.75 0 0 1 41.75 26 V 34 A 5.75 5.75 0 0 1 36 39.75 H 19 A 0.75 0.75 0 0 1 18.25 39 V 26 A 5.75 5.75 0 0 1 24 20.25 Z"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linejoin="round"
			/>
			<rect x="23.5" y="25.5" width="10" height="2.5" rx="1.25" fill="currentColor" />
			<rect x="23.5" y="31.5" width="6" height="2.5" rx="1.25" fill="currentColor" opacity="0.5" />
		{:else if name === 'cupones'}
			<!-- Un tiquete con las muescas a los lados y un corte. -->
			<path
				d="M 21 21.25 H 39 A 3.75 3.75 0 0 1 42.75 25 V 26.5 A 3.5 3.5 0 0 0 42.75 33.5 V 35 A 3.75 3.75 0 0 1 39 38.75 H 21 A 3.75 3.75 0 0 1 17.25 35 V 33.5 A 3.5 3.5 0 0 0 17.25 26.5 V 25 A 3.75 3.75 0 0 1 21 21.25 Z"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linejoin="round"
			/>
			<rect
				x="28.75"
				y="25.5"
				width="2.5"
				height="9"
				rx="1.25"
				fill="currentColor"
				transform="rotate(22 30 30)"
			/>
		{:else if name === 'envios'}
			<!-- Dos cajas de distinto tamaño apoyadas en la misma base. -->
			<rect
				x="15.25"
				y="21.75"
				width="14.5"
				height="16.5"
				rx="3"
				stroke="currentColor"
				stroke-width="2.5"
			/>
			<rect
				x="36.25"
				y="27.75"
				width="8.5"
				height="10.5"
				rx="3"
				stroke="currentColor"
				stroke-width="2.5"
				opacity="0.48"
			/>
		{:else if name === 'colecciones'}
			<!-- Dos tarjetas superpuestas: productos agrupados. -->
			<rect
				x="17.25"
				y="18.25"
				width="16.5"
				height="16.5"
				rx="4"
				stroke="currentColor"
				stroke-width="2.5"
				opacity="0.42"
			/>
			<rect
				x="24.25"
				y="24.25"
				width="16.5"
				height="16.5"
				rx="4"
				stroke="currentColor"
				stroke-width="2.5"
				class="fill-card"
			/>
		{:else if name === 'avisos'}
			<!-- Un círculo con exclamación: alguien quedó esperando. -->
			<circle cx="30" cy="30" r="11.25" stroke="currentColor" stroke-width="2.5" />
			<rect x="28.75" y="23.5" width="2.5" height="8" rx="1.25" fill="currentColor" />
			<circle cx="30" cy="35.25" r="1.75" fill="currentColor" />
		{:else if name === 'equipo'}
			<!-- Dos personas, una delante de la otra: permisos distintos. -->
			<circle
				cx="24.5"
				cy="30"
				r="7.25"
				stroke="currentColor"
				stroke-width="2.5"
				class="fill-card"
			/>
			<circle cx="35.5" cy="30" r="7.25" stroke="currentColor" stroke-width="2.5" opacity="0.45" />
		{/if}
	</svg>
</span>
