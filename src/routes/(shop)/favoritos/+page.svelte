<script lang="ts">
	import Heart from '@lucide/svelte/icons/heart';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import ProductGrid from '$lib/components/organisms/ProductGrid.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let loadForm = $state<HTMLFormElement | null>(null);
	let loading = $state(true);

	// Se piden las fichas al servidor cada vez que cambia la lista guardada.
	$effect(() => {
		void favorites.slugs.join(',');
		loadForm?.requestSubmit();
	});

	const products = $derived(form?.products ?? []);
</script>

<svelte:head>
	<title>Favoritos — {data.settings.store_name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
	<header class="mb-10 space-y-2">
		<p class="eyebrow">Tu selección</p>
		<h1 class="text-4xl md:text-5xl">Favoritos</h1>
	</header>

	<form
		method="POST"
		bind:this={loadForm}
		class="hidden"
		use:enhance={({ formData }) => {
			// Igual que el carrito: la lista vive en localStorage, así que se adjunta
			// al enviar y no como valor renderizado en el servidor.
			formData.set('slugs', favorites.slugs.join(','));
			loading = true;

			return async ({ update }) => {
				await update({ reset: false });
				loading = false;
			};
		}}
	>
		<input type="hidden" name="slugs" value="" />
	</form>

	{#if favorites.count === 0}
		<div
			class="border-border flex flex-col items-center gap-4 border border-dashed px-6 py-24 text-center"
		>
			<Heart class="text-muted-foreground size-10" />
			<h2 class="text-2xl">Todavía no guardas nada</h2>
			<p class="text-muted-foreground max-w-sm text-sm">
				Toca el corazón en cualquier prenda para tenerla a mano.
			</p>
			<Button href="/tienda">Ver la tienda</Button>
		</div>
	{:else if loading && products.length === 0}
		<p class="text-muted-foreground text-sm">Cargando tus prendas…</p>
	{:else}
		<ProductGrid {products} columns={4} />
	{/if}
</div>
