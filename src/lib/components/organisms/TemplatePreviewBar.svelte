<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';

	import type { StorefrontTemplate } from '$lib/domain/templates';
	import { Button } from '$lib/components/atoms/button';
	import { templateOf } from '$lib/domain/templates';
	import { exitPreviewUrl } from '$lib/template-preview';

	/**
	 * La barra que avisa que la tienda se está viendo con una plantilla en
	 * prueba. Es interfaz de Globerce, no de la tienda: lleva los tokens
	 * oscuros del sitio comercial (`.marketing-dark`) y no los de la
	 * plantilla, para que se lea como un aviso de afuera, igual con cualquier
	 * vestido.
	 *
	 * «Usarla» lleva al panel, que es quien la aplica: la vista previa no
	 * cambia nada por sí sola.
	 */
	interface Props {
		template: StorefrontTemplate;
	}

	let { template }: Props = $props();

	const info = $derived(templateOf(template));
</script>

<div
	class="marketing-dark bg-background text-foreground border-border fixed inset-x-0 bottom-0 z-40 border-t"
	role="status"
>
	<div
		class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 text-sm sm:px-6"
	>
		<p class="flex items-center gap-2">
			<Eye class="text-primary size-4 flex-none" aria-hidden="true" />
			<span>
				Vista previa con la plantilla <strong class="font-semibold">{info.name}</strong>. Solo tú la
				ves así; tu tienda no ha cambiado.
			</span>
		</p>

		<div class="ml-auto flex items-center gap-2">
			<Button href="/admin/portada" size="sm" class="rounded-full px-4">Usarla</Button>
			<Button href={exitPreviewUrl()} variant="ghost" size="sm" class="rounded-full px-4">
				Salir
			</Button>
		</div>
	</div>
</div>
