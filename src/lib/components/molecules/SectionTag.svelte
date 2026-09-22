<script lang="ts">
	import BadgeCheck from '@lucide/svelte/icons/badge-check';

	/**
	 * El antetítulo de cada sección del sitio comercial: una insignia y dos o
	 * tres palabras, en teal. Sustituye a las versalitas espaciadas del
	 * `.eyebrow`, que en una portada de producto se leían como etiqueta de
	 * archivo. Teal aquí no engaña: va pegado a un titular, no parece enlace.
	 */
	interface Props {
		label: string;
	}

	let { label }: Props = $props();
</script>

<p class="text-primary flex items-center gap-2 text-sm font-medium">
	<BadgeCheck class="size-4" aria-hidden="true" />
	{label}
</p>
