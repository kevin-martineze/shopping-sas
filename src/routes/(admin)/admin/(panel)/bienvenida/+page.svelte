<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import TemplatePicker from '$lib/components/organisms/TemplatePicker.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();
</script>

<svelte:head>
	<title>Elige tu plantilla — Globerce</title>
</svelte:head>

<header class="mb-6 space-y-1">
	<p class="eyebrow">Primer paso</p>
	<h1 class="text-3xl">¿Cómo quieres que se vea tu tienda?</h1>
	<p class="text-muted-foreground max-w-2xl text-sm">
		Elige con qué plantilla arrancas. Cambia los colores, la tipografía y cómo se arma la portada —
		nunca tus productos ni tus pedidos—, así que puedes cambiarla cuando quieras desde Portada.
	</p>
</header>

<FormFeedback error={form?.error ?? null} message={null} />

<TemplatePicker
	current={data.settings.template}
	storeUrl={data.storeUrl}
	action="?/plantilla&tienda={data.storeSlug}"
	cta="Empezar con esta"
/>

<p class="text-muted-foreground mt-6 text-sm">
	<a href="/admin?bienvenida={data.storeSlug}" class="hover:text-foreground underline">
		Lo decido después
	</a>
	· Tu tienda ya está en
	<a href={data.storeUrl} class="hover:text-foreground underline">
		{data.storeUrl.replace(/^https?:\/\//, '')}
	</a>
</p>
