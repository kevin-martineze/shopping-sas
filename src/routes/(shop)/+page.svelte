<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	import type { PageData } from './$types';
	import { reveal } from '$lib/actions/reveal';
	import { Button } from '$lib/components/atoms/button';
	import ProductGrid from '$lib/components/organisms/ProductGrid.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const hero = $derived(data.heroCollection);
	const heroImage = $derived(
		hero?.hero_image_url ?? data.newest.at(0)?.images.at(0)?.url_card ?? null
	);
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
				class="absolute inset-0 h-full w-full object-cover"
				fetchpriority="high"
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
			<div class="max-w-xl space-y-5 text-white" use:reveal>
				<p class="eyebrow text-white/80">
					{hero ? 'Colección en curso' : 'Nueva temporada'}
				</p>

				<h1 class="text-5xl leading-[0.95] text-balance text-white md:text-7xl">
					{hero ? hero.name : 'Prendas que duran más de una temporada'}
				</h1>

				<p class="max-w-md text-sm text-white/85 md:text-base">
					{hero?.description ??
						'Selección corta, materiales nobles y tallas reales. Escríbenos por WhatsApp y coordinamos tu pedido.'}
				</p>

				<div class="flex flex-wrap gap-3 pt-2">
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
	<section class="mx-auto max-w-7xl px-4 py-20 sm:px-6">
		<div class="mb-10 flex items-end justify-between gap-4" use:reveal>
			<div class="space-y-2">
				<p class="eyebrow">Selección</p>
				<h2 class="text-3xl md:text-4xl">Lo que más nos piden</h2>
			</div>

			<a
				href="/tienda"
				class="hover:text-foreground text-muted-foreground group hidden items-center gap-2 text-sm sm:flex"
			>
				Ver todo
				<ArrowRight class="size-4 transition-transform group-hover:translate-x-1" />
			</a>
		</div>

		<ProductGrid products={data.featured} />
	</section>
{/if}

<section class="bg-secondary/60">
	<div class="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-3">
		<div class="space-y-2" use:reveal>
			<p class="eyebrow">Pedidos</p>
			<h3 class="text-2xl">Se cierra por WhatsApp</h3>
			<p class="text-muted-foreground text-sm">
				Armas tu carrito acá y el pedido llega listo al chat, con tallas, colores y total.
			</p>
		</div>

		<div class="space-y-2" use:reveal={{ delay: 80 }}>
			<p class="eyebrow">Stock real</p>
			<h3 class="text-2xl">Sin sorpresas de talla</h3>
			<p class="text-muted-foreground text-sm">
				Cada talla y color tiene su inventario. Si aparece disponible, está disponible.
			</p>
		</div>

		<div class="space-y-2" use:reveal={{ delay: 160 }}>
			<p class="eyebrow">Envíos</p>
			<h3 class="text-2xl">A todo el país</h3>
			<p class="text-muted-foreground text-sm">
				{data.settings.free_shipping_threshold
					? `Envío gratis desde $${data.settings.free_shipping_threshold.toLocaleString('es-CO')}.`
					: 'Calculamos el costo según tu ciudad antes de confirmar.'}
			</p>
		</div>
	</div>
</section>

{#if data.newest.length > 0}
	<section class="mx-auto max-w-7xl px-4 py-20 sm:px-6">
		<div class="mb-10 space-y-2" use:reveal>
			<p class="eyebrow">Recién llegado</p>
			<h2 class="text-3xl md:text-4xl">Novedades</h2>
		</div>

		<ProductGrid products={data.newest} />
	</section>
{/if}
