<script lang="ts">
	import { page } from '$app/state';

	import { Button } from '$lib/components/atoms/button';

	const isNotFound = $derived(page.status === 404);
</script>

<svelte:head>
	<title>{isNotFound ? 'Página no encontrada' : 'Algo salió mal'}</title>
</svelte:head>

<main
	class="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center"
>
	<p class="eyebrow">Error {page.status}</p>

	<h1 class="text-4xl md:text-5xl">
		{isNotFound ? 'No encontramos esta página' : 'Algo salió mal'}
	</h1>

	<p class="text-muted-foreground max-w-md text-balance">
		{isNotFound
			? 'Puede que la prenda ya no esté disponible o que el enlace haya cambiado.'
			: (page.error?.message ?? 'Vuelve a intentarlo en un momento.')}
	</p>

	<div class="flex flex-wrap justify-center gap-3">
		<Button href="/">Ir al inicio</Button>
		<Button href="/tienda" variant="outline">Ver la tienda</Button>
	</div>
</main>
