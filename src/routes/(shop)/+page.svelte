<script lang="ts">
	import type { PageData } from './$types';
	import { parallax } from '$lib/actions/parallax';
	import { reveal } from '$lib/actions/reveal';
	import { Button } from '$lib/components/atoms/button';
	import SectionHeading from '$lib/components/molecules/SectionHeading.svelte';
	import CollectionBand from '$lib/components/organisms/CollectionBand.svelte';
	import ProductGrid from '$lib/components/organisms/ProductGrid.svelte';

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
		hero?.name ?? data.settings.hero_title ?? 'Prendas que duran más de una temporada'
	);

	const heroSubtitle = $derived(hero?.description ?? data.settings.hero_subtitle ?? '');

	// El lookbook no repite la colección que ya encabeza la portada.
	const lookbook = $derived(
		data.collections.filter((collection) => collection.id !== hero?.id).slice(0, 3)
	);

	// Novedades no repite lo que ya salió en la selección: además de aburrir,
	// dos tarjetas de la misma prenda comparten nombre de transición y el
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
		content="Prendas seleccionadas de {data.settings
			.store_name}. Pide por WhatsApp: te confirmamos disponibilidad y envío."
	/>
</svelte:head>

<section class="relative">
	<div class="relative min-h-[70vh] overflow-hidden md:min-h-[82vh]">
		{#if heroImage}
			<img
				src={heroImage}
				alt=""
				class="absolute inset-0 h-[120%] w-full object-cover"
				fetchpriority="high"
				use:parallax={{ amount: 0.18 }}
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
			></div>
		{:else}
			<div class="bg-muted absolute inset-0"></div>
		{/if}

		<div
			class="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-4 pb-14 sm:px-6 md:min-h-[82vh] md:pb-20"
		>
			<div class="max-w-2xl space-y-5 text-white">
				<div class="rise-clip">
					<p class="eyebrow rise rise-1 text-white/80">
						{hero ? 'Colección en curso' : 'Nueva temporada'}
					</p>
				</div>

				<div class="rise-clip">
					<h1 class="rise rise-2 text-5xl leading-[0.95] text-balance text-white md:text-8xl">
						{heroTitle}
					</h1>
				</div>

				{#if heroSubtitle}
					<div class="rise-clip">
						<p class="rise rise-3 max-w-md text-sm text-white/85 md:text-base">{heroSubtitle}</p>
					</div>
				{/if}

				<div class="rise rise-3 flex flex-wrap gap-3 pt-2">
					<Button href="/tienda" size="lg" class="bg-white text-black hover:bg-white/90">
						Ver la tienda
					</Button>

					{#if hero}
						<Button
							href="/colecciones/{hero.slug}"
							variant="outline"
							size="lg"
							class="border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white"
						>
							Ver la colección
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</div>
</section>

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
