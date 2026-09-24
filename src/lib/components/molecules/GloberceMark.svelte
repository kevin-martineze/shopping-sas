<script lang="ts">
	import logo from '$lib/assets/logo.png';

	/**
	 * El isotipo de Globerce: la esfera con la flecha y el carrito.
	 *
	 * Es un dibujo de mapa de bits y no un SVG porque así vino la marca. Eso
	 * tiene dos consecuencias que conviene conocer:
	 *
	 * - Se guarda a 512 px y se muestra siempre más chico, para que en pantallas
	 *   densas siga viéndose nítido. Pedirlo más grande que eso lo despinta.
	 * - Por debajo de 24 px los meridianos y el carrito se ensucian. Para eso
	 *   está el favicon, que el navegador escala con sus propias reglas.
	 *
	 * El archivo lo importa Vite y no vive en `static/`: así viaja con su huella
	 * en el nombre y el navegador puede guardarlo para siempre. Lo que sí está
	 * en `static/` es lo que necesita una dirección fija —favicon, icono de iOS
	 * y la imagen para compartir—, y todo sale de este mismo dibujo.
	 */
	interface Props {
		/** Lado en px. El dibujo es cuadrado y lleva su propio aire. */
		size?: number;
		/** Texto para lectores de pantalla. Vacío si va junto al nombre escrito. */
		label?: string;
		class?: string;
	}

	let { size = 32, label = 'Globerce', class: className }: Props = $props();
</script>

<img
	src={logo}
	width={size}
	height={size}
	alt={label}
	class={className}
	decoding="async"
	draggable="false"
/>
