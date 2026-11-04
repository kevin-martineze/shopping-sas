<script lang="ts">
	import type { PreviewZone } from '$lib/domain/preview';

	import { afterNavigate } from '$app/navigation';

	import { PREVIEW_ZONE_LABEL } from '$lib/domain/preview';
	import { storefrontDraft } from '$lib/stores/storefront-draft.svelte';

	/**
	 * Resalta la zona de la tienda que el módulo está editando.
	 *
	 * La tienda no sabe qué se está editando: solo pinta sus secciones con
	 * `data-preview-zone`. Este componente escucha la zona que llega en el
	 * borrador, la busca en el DOM, la enmarca con los tokens de la plantilla y
	 * le pega la etiqueta que explica qué es. Es puro adorno de la vista previa:
	 * fuera del editor no se monta.
	 */
	const FOCUS_CLASS = 'preview-focus';
	const LABEL_ATTRIBUTE = 'data-preview-label';

	let marked = $state<HTMLElement | null>(null);

	function clear() {
		if (!marked) return;

		marked.classList.remove(FOCUS_CLASS);
		marked.removeAttribute(LABEL_ATTRIBUTE);
		marked = null;
	}

	function show(zone: PreviewZone | null) {
		clear();

		if (!zone) return;

		const element = document.querySelector<HTMLElement>(`[data-preview-zone="${zone}"]`);

		if (!element) return;

		element.classList.add(FOCUS_CLASS);
		element.setAttribute(LABEL_ATTRIBUTE, PREVIEW_ZONE_LABEL[zone]);
		marked = element;

		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		element.scrollIntoView({
			behavior: reduce ? 'auto' : 'smooth',
			block: 'center'
		});
	}

	// La zona cambia cuando el panel manda otro borrador. El `return` limpia la
	// anterior antes de pintar la siguiente, y también al desmontar.
	$effect(() => {
		show(storefrontDraft.focus);

		return clear;
	});

	// Al navegar dentro de la tienda el foco sigue puesto, pero la sección es
	// otra: se vuelve a buscar cuando la página nueva ya está montada. En la
	// primera navegación ya lo hizo el efecto de arriba.
	afterNavigate(({ from }) => {
		if (from) show(storefrontDraft.focus);
	});
</script>
