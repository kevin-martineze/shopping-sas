import type { Action } from 'svelte/action';

interface ParallaxOptions {
	/** Cuánto se desplaza la imagen respecto al scroll: 0.2 es sutil. */
	amount?: number;
	/**
	 * `page` mide el scroll de la página — sirve al hero, que arranca arriba.
	 * `element` mide el recorrido del elemento por la ventana y reparte el
	 * desplazamiento a lado y lado, para bloques que viven más abajo.
	 */
	from?: 'page' | 'element';
}

/**
 * Desplaza el elemento más despacio que la página al hacer scroll. Da
 * profundidad sin que se note el truco.
 */
export const parallax: Action<HTMLElement, ParallaxOptions | undefined> = (node, options) => {
	const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)');

	// Con movimiento reducido no se anima nada: la foto se queda quieta.
	if (reduced?.matches) return;

	const amount = options?.amount ?? 0.2;
	const from = options?.from ?? 'page';
	let frame = 0;

	function offsetFor(): number {
		if (from === 'page') return window.scrollY * amount;

		const rect = node.getBoundingClientRect();
		const viewport = window.innerHeight;
		const travel = viewport + rect.height;
		const progress = Math.min(Math.max((viewport - rect.top) / travel, 0), 1);

		return (progress - 0.5) * amount * rect.height;
	}

	function update() {
		frame = 0;
		node.style.transform = `translate3d(0, ${offsetFor()}px, 0)`;
	}

	function onScroll() {
		if (frame) return;
		frame = requestAnimationFrame(update);
	}

	update();
	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('resize', onScroll, { passive: true });

	return {
		destroy() {
			if (frame) cancelAnimationFrame(frame);
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		}
	};
};
