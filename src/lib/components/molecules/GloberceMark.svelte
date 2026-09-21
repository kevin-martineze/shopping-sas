<script lang="ts">
	/**
	 * El isotipo de Globerce: la esfera de Globin con la cinta de flechas
	 * cerrándose en una G.
	 *
	 * Viene del brandkit tal cual. Dos reglas suyas viven aquí porque son del
	 * isotipo y no de quien lo usa:
	 *
	 * - El gradiente de la esfera solo existe en este dibujo. El resto de la
	 *   interfaz usa teal plano.
	 * - Por debajo de 32 px la esfera y los meridianos se ensucian: para eso
	 *   está el favicon de solo-G (`static/favicon.svg`), no este componente.
	 *
	 * Los ids de los gradientes llevan un sufijo propio: con dos isotipos en la
	 * misma página —cabecera y pie— compartirían `id` y el segundo pintaría con
	 * el gradiente del primero, o con ninguno si el primero se desmonta.
	 */
	interface Props {
		/** Lado en px. El kit pide 32 como mínimo. */
		size?: number;
		/** Texto para lectores de pantalla. Vacío si va junto al nombre escrito. */
		label?: string;
		class?: string;
	}

	let { size = 32, label = 'Globerce', class: className }: Props = $props();

	const uid = $props.id();
	const esfera = `gb-esfera-${uid}`;
	const flecha = `gb-flecha-${uid}`;
	const recorte = `gb-recorte-${uid}`;
</script>

<svg
	viewBox="0 0 120 120"
	width={size}
	height={size}
	class={className}
	role={label ? 'img' : undefined}
	aria-label={label || undefined}
	aria-hidden={label ? undefined : 'true'}
>
	<defs>
		<linearGradient id={esfera} x1="0.1" y1="0.05" x2="0.9" y2="1">
			<stop offset="0" stop-color="#48A79C" />
			<stop offset="0.52" stop-color="#2B807C" />
			<stop offset="1" stop-color="#1C5C67" />
		</linearGradient>
		<linearGradient id={flecha} x1="0.1" y1="1" x2="0.95" y2="0.05">
			<stop offset="0" stop-color="#CBD8D7" />
			<stop offset="0.42" stop-color="#FFFFFF" />
			<stop offset="1" stop-color="#E2ECEB" />
		</linearGradient>
		<clipPath id={recorte}><circle cx="56" cy="62" r="37" /></clipPath>
	</defs>

	<g transform="translate(-5.5,1)">
		<circle cx="56" cy="62" r="37" fill="url(#{esfera})" />
		<g clip-path="url(#{recorte})" fill="none" stroke="#0E1A1C" stroke-width="2.4" opacity="0.42">
			<ellipse cx="56" cy="62" rx="15.5" ry="37" />
			<ellipse cx="56" cy="62" rx="37" ry="14.5" transform="rotate(-16 56 62)" />
		</g>

		<g fill="#0E1A1C">
			<polygon points="0,-14 19,0 0,14" transform="translate(98,22) rotate(-45)" />
			<polygon points="0,-14 19,0 0,14" transform="translate(92,76) rotate(-75)" />
		</g>
		<path
			d="M 98,22 C 80,41 62,52 50,66 C 36,83 45,100 63,99 C 80,98 90,88 92,76"
			fill="none"
			stroke="#0E1A1C"
			stroke-width="19"
			stroke-linecap="round"
		/>
		<path
			d="M 98,22 C 80,41 62,52 50,66 C 36,83 45,100 63,99 C 80,98 90,88 92,76"
			fill="none"
			stroke="url(#{flecha})"
			stroke-width="11"
			stroke-linecap="round"
		/>
		<g fill="url(#{flecha})">
			<polygon points="0,-9.5 13.5,0 0,9.5" transform="translate(97,23) rotate(-45)" />
			<polygon points="0,-9.5 13.5,0 0,9.5" transform="translate(91.5,76) rotate(-75)" />
		</g>
	</g>
</svg>
