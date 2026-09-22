<script lang="ts">
	import { Button } from '$lib/components/atoms/button';
	import GloberceMark from '$lib/components/molecules/GloberceMark.svelte';

	/**
	 * La cabecera del sitio comercial: oscura siempre, para que sea la misma
	 * sobre el hero pizarra y sobre las secciones blancas.
	 *
	 * Fija y no sticky: el contenido se desplaza con transformaciones
	 * (ScrollSmoother), y un sticky dentro de él se movería con la página.
	 */
	interface Props {
		signedIn: boolean;
	}

	let { signedIn }: Props = $props();

	const secciones = [
		{ href: '#como-funciona', label: 'Cómo funciona' },
		{ href: '#que-vendes', label: 'Para quién es' },
		{ href: '#precios', label: 'Precios' },
		{ href: '#preguntas', label: 'Preguntas' }
	];
</script>

<header
	class="marketing-dark border-border bg-background/80 text-foreground fixed inset-x-0 top-0 z-30 border-b backdrop-blur-md"
>
	<div class="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3.5 sm:px-6">
		<a href="/" class="flex items-center gap-2" aria-label="Globerce, inicio">
			<GloberceMark size={32} label="" />
			<span class="text-xl font-semibold tracking-tight">Globerce</span>
		</a>

		<nav class="text-muted-foreground mx-auto hidden items-center gap-1 text-sm md:flex">
			{#each secciones as seccion (seccion.href)}
				<a
					href={seccion.href}
					class="hover:text-foreground rounded-full px-3 py-1.5 transition-colors"
				>
					{seccion.label}
				</a>
			{/each}
		</nav>

		<div class="ml-auto flex items-center gap-2 md:ml-0">
			{#if signedIn}
				<Button href="/admin" class="h-9 px-4">Ir a mi panel</Button>
			{:else}
				<Button href="/admin/login" variant="ghost" class="hidden h-9 px-4 sm:inline-flex">
					Entrar
				</Button>
				<Button href="/registro" class="h-9 px-4">Empieza gratis</Button>
			{/if}
		</div>
	</div>
</header>
