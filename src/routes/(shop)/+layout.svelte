<script lang="ts">
	import type { Snippet } from 'svelte';

	import type { LayoutData } from './$types';
	import CartDrawer from '$lib/components/organisms/CartDrawer.svelte';
	import SiteFooter from '$lib/components/organisms/SiteFooter.svelte';
	import SiteHeader from '$lib/components/organisms/SiteHeader.svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	// Carrito y favoritos viven en localStorage: se hidratan al montar en cliente.
	$effect(() => {
		cart.hydrate();
		favorites.hydrate();
	});
</script>

<div class="flex min-h-screen flex-col">
	<SiteHeader
		settings={data.settings}
		categories={data.categories}
		collections={data.collections}
	/>

	<main class="flex-1">
		{@render children()}
	</main>

	<SiteFooter settings={data.settings} categories={data.categories} />
</div>

<CartDrawer />
