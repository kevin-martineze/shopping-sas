<script lang="ts">
	import type { Snippet } from 'svelte';

	import { onMount } from 'svelte';

	/**
	 * Desplazamiento suavizado y revelado de secciones, con GSAP.
	 *
	 * Usa ScrollSmoother, que mueve el contenido con transformaciones en vez de
	 * dejar que el navegador desplace la página. Eso da la inercia, pero tiene
	 * tres consecuencias que este componente resuelve:
	 *
	 * - Nada con `position: fixed` o `sticky` puede vivir aquí dentro: se
	 *   movería con el contenido. La cabecera va fuera, fija.
	 * - Los enlaces a `#ancla` saltarían en seco. Se interceptan y se mandan al
	 *   suavizador, descontando lo que tapa la cabecera.
	 * - Quien pidió al sistema reducir el movimiento no recibe nada: ni
	 *   inercia ni revelados. La página funciona igual, solo que quieta.
	 *
	 * GSAP se carga dentro de `onMount` y no arriba: así no entra en el
	 * render del servidor ni en el paquete de las páginas que no lo usan.
	 *
	 * Qué se revela lo deciden dos atributos en el contenido:
	 * - `data-reveal` en un bloque: sus hijos directos suben en cascada.
	 * - `data-reveal-group` en una rejilla dentro de ese bloque: en vez de
	 *   subir entera, suben sus elementos uno a uno.
	 */
	interface Props {
		children: Snippet;
		/** Lo que ocupa la cabecera fija, para que un ancla no quede debajo. */
		offset?: number;
	}

	let { children, offset = 72 }: Props = $props();

	let wrapper = $state<HTMLDivElement>();
	let content = $state<HTMLDivElement>();

	/** Las piezas a revelar, según las marcas del contenido. */
	function piezas(raiz: HTMLElement): HTMLElement[] {
		const salida: HTMLElement[] = [];

		for (const bloque of raiz.querySelectorAll<HTMLElement>('[data-reveal]')) {
			for (const hijo of bloque.children) {
				if (!(hijo instanceof HTMLElement)) continue;

				if (hijo.hasAttribute('data-reveal-group')) {
					for (const nieto of hijo.children) {
						if (nieto instanceof HTMLElement) salida.push(nieto);
					}
				} else {
					salida.push(hijo);
				}
			}
		}

		return salida;
	}

	onMount(() => {
		if (!wrapper || !content) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		// La carga es asíncrona: si la página se abandona antes de que llegue,
		// no hay que montar nada sobre un DOM que ya no está.
		let cancelado = false;
		let limpiar = () => {};

		const raizWrapper = wrapper;
		const raizContent = content;

		void (async () => {
			const [{ gsap }, { ScrollTrigger }, { ScrollSmoother }] = await Promise.all([
				import('gsap'),
				import('gsap/ScrollTrigger'),
				import('gsap/ScrollSmoother')
			]);

			if (cancelado) return;

			gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

			const smoother = ScrollSmoother.create({
				wrapper: raizWrapper,
				content: raizContent,
				// Cuánto tarda en alcanzar la posición real, en segundos. Más
				// de 1.2 empieza a sentirse como que la página no obedece.
				smooth: 1.1,
				// Habilita `data-speed` para el paralaje suave del hero.
				effects: true,
				// En pantallas táctiles el desplazamiento nativo ya tiene
				// inercia; encima de él, la segunda se siente como retraso.
				smoothTouch: false
			});

			const elementos = piezas(raizContent);

			// Se ocultan aquí y no en el CSS: sin JavaScript, o si GSAP no
			// carga, el contenido tiene que verse igual.
			gsap.set(elementos, { autoAlpha: 0, y: 28 });

			ScrollTrigger.batch(elementos, {
				start: 'top 90%',
				once: true,
				onEnter: (lote) =>
					gsap.to(lote, {
						autoAlpha: 1,
						y: 0,
						duration: 0.9,
						ease: 'power3.out',
						stagger: 0.08,
						overwrite: true
					})
			});

			function irAlAncla(evento: MouseEvent) {
				if (!(evento.target instanceof Element)) return;

				const enlace = evento.target.closest<HTMLAnchorElement>('a[href^="#"]');

				if (!enlace || enlace.hash.length < 2) return;

				const destino = document.getElementById(decodeURIComponent(enlace.hash.slice(1)));

				if (!destino) return;

				evento.preventDefault();
				smoother.scrollTo(destino, true, `top ${offset}px`);
				// La dirección conserva el ancla: se puede copiar y compartir.
				history.replaceState(history.state, '', enlace.hash);
			}

			document.addEventListener('click', irAlAncla);

			// Si se llegó con un ancla en la dirección, se va allí una vez que
			// el contenido ya está montado sobre el suavizador.
			if (location.hash.length > 1) {
				const inicial = document.getElementById(decodeURIComponent(location.hash.slice(1)));

				if (inicial) smoother.scrollTo(inicial, false, `top ${offset}px`);
			}

			limpiar = () => {
				document.removeEventListener('click', irAlAncla);
				ScrollTrigger.getAll().forEach((disparador) => disparador.kill());
				smoother.kill();
				// Sin esto, al volver a la página por navegación del cliente los
				// elementos seguirían con la opacidad en cero.
				gsap.set(elementos, { clearProps: 'opacity,visibility,transform' });
			};
		})();

		return () => {
			cancelado = true;
			limpiar();
		};
	});
</script>

<div bind:this={wrapper}>
	<div bind:this={content}>
		{@render children()}
	</div>
</div>
