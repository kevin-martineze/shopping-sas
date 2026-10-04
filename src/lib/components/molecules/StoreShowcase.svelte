<script lang="ts">
	import type { Shot } from '$lib/config/capturas';
	import { HOST_MAQUETA } from '$lib/config/maqueta';
	import { cn } from '$lib/utils';

	/**
	 * Una tienda de Globerce de verdad: en un navegador, y en un celular encima.
	 *
	 * A diferencia de `PhoneMock` y las tarjetas de la portada, estas son fotos.
	 * Para el panel una maqueta basta, pero «así se ve tu tienda terminada»
	 * convence más con una tienda real, con sus fotos y sus precios. Para que no envejezcan sin
	 * remedio salen de `scripts/capturas-marketing.mjs`, que las vuelve a tomar.
	 *
	 * Cada foto llega en dos anchos (`srcset`) y con su tamaño, así la página no
	 * salta mientras cargan. Las fotos y sus textos alternativos están en
	 * `$lib/config/capturas`.
	 */

	interface Props {
		desktop: Shot;
		mobile: Shot;
		/** Lo que se lee en la barra del navegador. */
		address?: string;
		/** Arriba de la página: que cargue ya y no en diferido. */
		eager?: boolean;
		class?: string;
	}

	let {
		desktop,
		mobile,
		address = HOST_MAQUETA,
		eager = false,
		class: className
	}: Props = $props();

	const loading = $derived(eager ? 'eager' : 'lazy');
</script>

<figure class={cn('relative pb-6 sm:pb-10', className)}>
	<div class="device-browser w-10/12">
		<div class="device-browser-bar">
			<i></i>
			<i></i>
			<i></i>
			<span
				class="device-browser-url ml-3 hidden max-w-xs flex-1 truncate px-2.5 py-0.5 text-xs sm:block"
			>
				{address}
			</span>
		</div>

		<img
			src={desktop.src}
			srcset={desktop.srcset}
			sizes="(min-width: 1024px) 50rem, 85vw"
			width={desktop.width}
			height={desktop.height}
			alt={desktop.alt}
			{loading}
			decoding="async"
			class="block h-auto w-full"
		/>
	</div>

	<div class="device-phone absolute right-0 bottom-0 w-1/4 sm:w-1/5">
		<img
			src={mobile.src}
			srcset={mobile.srcset}
			sizes="(min-width: 1024px) 12rem, 25vw"
			width={mobile.width}
			height={mobile.height}
			alt={mobile.alt}
			{loading}
			decoding="async"
		/>
	</div>
</figure>
