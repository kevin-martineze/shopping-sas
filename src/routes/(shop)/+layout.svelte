<script lang="ts">
	import type { Snippet } from 'svelte';

	import type { LayoutData } from './$types';
	import CartDrawer from '$lib/components/organisms/CartDrawer.svelte';
	import SiteFooter from '$lib/components/organisms/SiteFooter.svelte';
	import SiteHeader from '$lib/components/organisms/SiteHeader.svelte';
	import StoreAssistant from '$lib/components/organisms/StoreAssistant.svelte';
	import TemplatePreviewBar from '$lib/components/organisms/TemplatePreviewBar.svelte';
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

<svelte:head>
	{#if data.previewTemplate}
		<!-- Una tienda con un vestido de prueba no es la tienda: que no la indexen. -->
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<!--
	La plantilla viste toda la vitrina: los tokens de `app.css` se redefinen bajo
	este atributo, así que basta ponerlo una vez acá para que hereden cabecera,
	páginas y pie. El panel, que vive en otro layout, no se entera. Si hay una
	plantilla en prueba, `settings.template` ya viene con ella desde el load.
-->
<div
	data-storefront-template={data.settings.template}
	class="bg-background text-foreground flex min-h-screen flex-col"
>
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

{#if data.previewTemplate}
	<TemplatePreviewBar template={data.previewTemplate} />
{/if}

{#if data.settings.assistant}
	<!-- Solo si el plan de la tienda lo incluye y la plataforma lo tiene
	     encendido: el botón no aparece para prometer algo que no responde. -->
	<StoreAssistant
		storeName={data.settings.store_name}
		whatsappPhone={data.settings.whatsapp_phone}
	/>
{/if}
