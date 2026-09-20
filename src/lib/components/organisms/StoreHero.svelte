<script lang="ts">
	import type { StorefrontTemplate } from '$lib/domain/templates';
	import { parallax } from '$lib/actions/parallax';
	import { Button } from '$lib/components/atoms/button';

	/**
	 * La portada de la tienda, en la plantilla que eligió la dueña.
	 *
	 * Las dos variantes muestran lo mismo —etiqueta, título, subtítulo y los
	 * dos botones—: lo que cambia es cómo se arma. `editorial` pone la foto a
	 * sangre con el texto encima; `boutique` parte la pantalla en dos y deja el
	 * texto sobre el fondo de la tienda, que se lee mejor con fotos claras.
	 */
	interface Props {
		template: StorefrontTemplate;
		eyebrow: string;
		title: string;
		subtitle: string;
		image: string | null;
		/** Slug de la colección de la portada, si hay. */
		collectionSlug: string | null;
	}

	let { template, eyebrow, title, subtitle, image, collectionSlug }: Props = $props();
</script>

{#if template === 'boutique'}
	<section class="bg-secondary/50">
		<div
			class="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:gap-14 md:py-20"
		>
			<div class="order-2 space-y-6 md:order-1">
				<p class="eyebrow">{eyebrow}</p>
				<h1 class="text-4xl leading-[1.05] text-balance md:text-6xl">{title}</h1>

				{#if subtitle}
					<p class="text-muted-foreground max-w-md text-base leading-relaxed">{subtitle}</p>
				{/if}

				<div class="flex flex-wrap gap-3 pt-1">
					<Button href="/tienda" size="lg">Ver la tienda</Button>

					{#if collectionSlug}
						<Button href="/colecciones/{collectionSlug}" variant="outline" size="lg">
							Ver la colección
						</Button>
					{/if}
				</div>
			</div>

			<div class="order-1 md:order-2">
				{#if image}
					<img
						src={image}
						alt=""
						class="aspect-[4/5] w-full rounded-[var(--radius)] object-cover md:aspect-[4/5]"
						fetchpriority="high"
					/>
				{:else}
					<div class="bg-muted aspect-[4/5] w-full rounded-[var(--radius)]"></div>
				{/if}
			</div>
		</div>
	</section>
{:else}
	<section class="relative">
		<div class="relative min-h-[70vh] overflow-hidden md:min-h-[82vh]">
			{#if image}
				<img
					src={image}
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
						<p class="eyebrow rise rise-1 text-white/80">{eyebrow}</p>
					</div>

					<div class="rise-clip">
						<h1 class="rise rise-2 text-5xl leading-[0.95] text-balance text-white md:text-8xl">
							{title}
						</h1>
					</div>

					{#if subtitle}
						<div class="rise-clip">
							<p class="rise rise-3 max-w-md text-sm text-white/85 md:text-base">{subtitle}</p>
						</div>
					{/if}

					<div class="rise rise-3 flex flex-wrap gap-3 pt-2">
						<Button href="/tienda" size="lg" class="bg-white text-black hover:bg-white/90">
							Ver la tienda
						</Button>

						{#if collectionSlug}
							<Button
								href="/colecciones/{collectionSlug}"
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
{/if}
