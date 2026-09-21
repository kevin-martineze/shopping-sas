<script lang="ts">
	import type { PageData } from './$types';
	import { reveal } from '$lib/actions/reveal';
	import SectionHeading from '$lib/components/molecules/SectionHeading.svelte';
	import CollectionBand from '$lib/components/organisms/CollectionBand.svelte';
	import ProductGrid from '$lib/components/organisms/ProductGrid.svelte';
	import StoreHero from '$lib/components/organisms/StoreHero.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const hero = $derived(data.heroCollection);
	const heroImage = $derived(
		hero?.hero_image_url ?? data.newest.at(0)?.images.at(0)?.url_card ?? null
	);

	// Manda la colección elegida; si no hay, los textos de ajustes.
	const heroTitle = $derived(
		hero?.name ?? data.settings.hero_title ?? 'Productos que duran más de una temporada'
	);

	const heroSubtitle = $derived(hero?.description ?? data.settings.hero_subtitle ?? '');

	// El lookbook no repite la colección que ya encabeza la portada.
	const lookbook = $derived(
		data.collections.filter((collection) => collection.id !== hero?.id).slice(0, 3)
	);

	// Novedades no repite lo que ya salió en la selección: además de aburrir,
	// dos tarjetas de la misma producto comparten nombre de transición y el
	// navegador descarta la animación al abrir la ficha.
	const fresh = $derived.by(() => {
		const shown = new Set(data.featured.map((product) => product.id));
		return data.newest.filter((product) => !shown.has(product.id));
	});

	// La numeración cuenta solo las secciones que se pintan: sin colecciones
	// propias, Novedades es 02 y no queda un hueco en la serie.
	const sectionNumber = $derived.by(() => {
		const order: string[] = [];

		if (data.featured.length > 0) order.push('featured');
		if (lookbook.length > 0) order.push('lookbook');
		if (fresh.length > 0) order.push('newest');

		return (name: string) => String(order.indexOf(name) + 1).padStart(2, '0');
	});
</script>

<svelte:head>
	<title>{data.settings.store_name} — Ropa</title>
	<meta
		name="description"
		content="Productos seleccionadas de {data.settings
			.store_name}. Pide por WhatsApp: te confirmamos disponibilidad y envío."
	/>
</svelte:head>

<StoreHero
	template={data.settings.template}
	eyebrow={hero ? 'Colección en curso' : 'Nueva temporada'}
	title={heroTitle}
	subtitle={heroSubtitle}
	image={heroImage}
	collectionSlug={hero?.slug ?? null}
/>

{#if data.featured.length > 0}
	<section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
		<SectionHeading
			index={sectionNumber('featured')}
			eyebrow="Selección"
			title="Lo que más nos piden"
			href="/tienda"
		/>
		<ProductGrid products={data.featured} />
	</section>
{/if}

{#if data.highlights.length > 0}
	<section class="bg-secondary/60">
		<div class="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-3">
			{#each data.highlights as highlight, index (highlight.id)}
				<div class="border-border space-y-2 border-t pt-6" use:reveal={{ delay: index * 80 }}>
					<p class="eyebrow flex items-center gap-3">
						<span class="text-muted-foreground tabular-nums">
							{String(index + 1).padStart(2, '0')}
						</span>
						<span>{highlight.eyebrow}</span>
					</p>
					<h3 class="text-2xl">{highlight.title}</h3>
					<p class="text-muted-foreground text-sm leading-relaxed">{highlight.body}</p>
				</div>
			{/each}
		</div>
	</section>
{/if}

{#if lookbook.length > 0}
	<section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
		<SectionHeading
			index={sectionNumber('lookbook')}
			eyebrow="Lookbook"
			title="Colecciones"
			href="/colecciones"
			linkLabel="Ver todas"
		/>

		<div class="space-y-16 md:space-y-24">
			{#each lookbook as collection, index (collection.id)}
				<CollectionBand
					{collection}
					index={String(index + 1).padStart(2, '0')}
					flipped={index % 2 === 1}
				/>
			{/each}
		</div>
	</section>
{/if}

{#if fresh.length > 0}
	<section class="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28">
		<SectionHeading
			index={sectionNumber('newest')}
			eyebrow="Recién llegado"
			title="Novedades"
			href="/tienda"
		/>
		<ProductGrid products={fresh} />
	</section>
{/if}
