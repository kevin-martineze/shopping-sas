import type { Action } from 'svelte/action';

interface RevealOptions {
	/** Retraso en ms, para escalonar elementos de una misma fila. */
	delay?: number;
	/** Fracción visible del elemento antes de disparar. */
	threshold?: number;
}

/**
 * Revela el elemento al entrar en viewport. La animación vive en `app.css`
 * (.reveal / .reveal-visible) y se anula sola con prefers-reduced-motion.
 */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) => {
	// Sin IntersectionObserver (o en SSR hidratado sin soporte) el contenido
	// se muestra tal cual: nunca se esconde algo que no podamos revelar.
	if (typeof IntersectionObserver === 'undefined') {
		node.classList.add('reveal-visible');
		return;
	}

	node.classList.add('reveal');

	if (options?.delay) {
		node.style.transitionDelay = `${options.delay}ms`;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (!entry.isIntersecting) continue;
				node.classList.add('reveal-visible');
				observer.unobserve(node);
			}
		},
		{ threshold: options?.threshold ?? 0.12, rootMargin: '0px 0px -40px 0px' }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
};
