<script lang="ts">
	import type { Snippet } from 'svelte';

	import type { LayoutData } from './$types';
	import { page } from '$app/state';

	import PreviewFocus from '$lib/components/molecules/PreviewFocus.svelte';
	import CartDrawer from '$lib/components/organisms/CartDrawer.svelte';
	import SiteFooter from '$lib/components/organisms/SiteFooter.svelte';
	import SiteHeader from '$lib/components/organisms/SiteHeader.svelte';
	import StoreAssistant from '$lib/components/organisms/StoreAssistant.svelte';
	import TemplatePreviewBar from '$lib/components/organisms/TemplatePreviewBar.svelte';
	import { themeStyle } from '$lib/domain/theme';
	import { cart } from '$lib/stores/cart.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { storefrontDraft } from '$lib/stores/storefront-draft.svelte';

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

	// Dentro del editor de diseño la tienda se viste con el borrador que llega
	// por `postMessage`; fuera de él, `apply` devuelve los ajustes tal cual.
	$effect(() => {
		if (data.draftPreview) storefrontDraft.listen();
	});

	const settings = $derived(storefrontDraft.apply(data.settings));
	const categories = $derived(storefrontDraft.applyCategories(data.categories));

	// La dirección canónica es la pública de la tienda (dominio propio si lo tiene), nunca `PUBLIC_SITE_URL`.
	const canonical = $derived(`${data.public_url.replace(/\/+$/, '')}${page.url.pathname}`);
</script>

<svelte:head>
	<link rel="canonical" href={canonical} />
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
	Los ajustes de la dueña (color, letras, esquinas) pisan esos tokens con un
	`style` en el mismo elemento.
-->
<div
	data-storefront-template={settings.template}
	style={themeStyle(settings.template, settings.theme) || undefined}
	class="bg-background text-foreground flex min-h-screen flex-col"
>
	<SiteHeader
		{settings}
		{categories}
		collections={data.collections}
		draftPreview={data.draftPreview}
	/>

	<main class="flex-1">
		{@render children()}
	</main>

	<SiteFooter {settings} {categories} draftPreview={data.draftPreview} />
</div>

{#if data.draftPreview}
	<!-- Solo dentro del editor: resalta la zona que el módulo está editando. -->
	<PreviewFocus />
{/if}

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
