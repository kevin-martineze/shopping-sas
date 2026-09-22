<script lang="ts">
	import type { StorefrontTemplate } from '$lib/domain/templates';
	import { parallax } from '$lib/actions/parallax';
	import { Button } from '$lib/components/atoms/button';
	import { templateOf } from '$lib/domain/templates';
	import { cn } from '$lib/utils';

	/**
	 * La portada de la tienda, en la plantilla que eligió la dueña.
	 *
	 * Todas las variantes muestran lo mismo —etiqueta, título, subtítulo y los
	 * dos botones—: lo que cambia es cómo se arma, y eso lo decide `hero` en la
	 * ficha de la plantilla (`$lib/domain/templates`):
	 *
	 * - `cover`: la foto a sangre con el texto encima. Editorial y Noche.
	 * - `split`: la pantalla en dos; el texto sobre el fondo de la tienda, que
	 *   se lee mejor con fotos claras. Cálida.
	 * - `typographic`: sin foto grande. El titular enorme, una regla y ya: los
	 *   productos de abajo son la portada. Galería.
	 * - `centered`: todo centrado y la foto enmarcada. Atelier.
	 * - `block`: un bloque del color de la marca con la foto recortada al lado.
	 *   Vibrante.
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

	const layout = $derived(templateOf(template).hero);

	/**
	 * En la portada a sangre el texto va en blanco sobre la foto oscurecida.
	 * Sin foto no hay nada que oscurecer: el fondo es el `muted` de la
	 * plantilla y el texto toma su color normal, si no salía blanco sobre gris.
	 */
	const sobreFoto = $derived(image !== null);
</script>

{#if layout === 'split'}
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
{:else if layout === 'typographic'}
	<section class="border-border border-b">
		<div class="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 md:pt-28 md:pb-16">
			<div class="rise-clip">
				<p class="eyebrow rise rise-1">{eyebrow}</p>
			</div>

			<div class="rise-clip">
				<h1 class="rise rise-2 mt-5 max-w-5xl text-5xl leading-[0.98] text-balance md:text-8xl">
					{title}
				</h1>
			</div>

			<div
				class="rise rise-3 mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
			>
				{#if subtitle}
					<p class="text-muted-foreground max-w-md text-sm leading-relaxed md:text-base">
						{subtitle}
					</p>
				{:else}
					<span></span>
				{/if}

				<div class="flex flex-wrap gap-3">
					<Button href="/tienda" size="lg">Ver la tienda</Button>

					{#if collectionSlug}
						<Button href="/colecciones/{collectionSlug}" variant="outline" size="lg">
							Ver la colección
						</Button>
					{/if}
				</div>
			</div>
		</div>
	</section>
{:else if layout === 'centered'}
	<section>
		<div
			class="mx-auto flex max-w-4xl flex-col items-center px-4 pt-16 pb-14 text-center sm:px-6 md:pt-24 md:pb-20"
		>
			<p class="eyebrow rise rise-1">{eyebrow}</p>
			<h1 class="rise rise-2 mt-5 max-w-3xl text-4xl leading-[1.05] text-balance md:text-6xl">
				{title}
			</h1>

			{#if subtitle}
				<p
					class="text-muted-foreground rise rise-3 mt-5 max-w-md text-sm leading-relaxed md:text-base"
				>
					{subtitle}
				</p>
			{/if}

			<!-- La foto va enmarcada por el fondo: un borde y el aire del passe-partout. -->
			<div class="border-border rise rise-3 mt-10 w-full max-w-2xl border p-3 md:p-4">
				{#if image}
					<img src={image} alt="" class="aspect-[4/3] w-full object-cover" fetchpriority="high" />
				{:else}
					<div class="bg-muted aspect-[4/3] w-full"></div>
				{/if}
			</div>

			<div class="mt-10 flex flex-wrap justify-center gap-3">
				<Button href="/tienda" size="lg">Ver la tienda</Button>

				{#if collectionSlug}
					<Button href="/colecciones/{collectionSlug}" variant="outline" size="lg">
						Ver la colección
					</Button>
				{/if}
			</div>
		</div>
	</section>
{:else if layout === 'block'}
	<section class="px-4 pt-4 sm:px-6">
		<div
			class="bg-primary text-primary-foreground mx-auto grid max-w-7xl items-center gap-8 overflow-hidden rounded-[calc(var(--radius)*1.5)] px-6 py-12 md:grid-cols-[1.1fr_1fr] md:gap-12 md:px-12 md:py-16"
		>
			<div class="space-y-6">
				<p class="eyebrow text-primary-foreground/80">{eyebrow}</p>
				<h1 class="text-5xl leading-[0.98] text-balance md:text-7xl">{title}</h1>

				{#if subtitle}
					<p class="text-primary-foreground/85 max-w-md text-base leading-relaxed">{subtitle}</p>
				{/if}

				<div class="flex flex-wrap gap-3 pt-1">
					<Button
						href="/tienda"
						size="lg"
						class="bg-secondary text-secondary-foreground hover:bg-secondary/90"
					>
						Ver la tienda
					</Button>

					{#if collectionSlug}
						<Button
							href="/colecciones/{collectionSlug}"
							variant="outline"
							size="lg"
							class="border-primary-foreground/50 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground bg-transparent"
						>
							Ver la colección
						</Button>
					{/if}
				</div>
			</div>

			<div class="md:justify-self-end">
				{#if image}
					<img
						src={image}
						alt=""
						class="aspect-square w-full max-w-md rotate-2 rounded-[var(--radius)] object-cover shadow-2xl"
						fetchpriority="high"
					/>
				{:else}
					<div
						class="bg-secondary aspect-square w-full max-w-md rotate-2 rounded-[var(--radius)]"
					></div>
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
				<!-- `.hero-veil` deja que cada plantilla decida cuánto oscurece la foto. -->
				<div class="hero-veil absolute inset-0"></div>
			{:else}
				<div class="bg-muted absolute inset-0"></div>
			{/if}

			<div
				class="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-end px-4 pb-14 sm:px-6 md:min-h-[82vh] md:pb-20"
			>
				<div class={cn('max-w-2xl space-y-5', sobreFoto ? 'text-white' : 'text-foreground')}>
					<div class="rise-clip">
						<p class={cn('eyebrow rise rise-1', sobreFoto && 'text-white/80')}>{eyebrow}</p>
					</div>

					<div class="rise-clip">
						<h1 class="rise rise-2 text-5xl leading-[0.95] text-balance md:text-8xl">{title}</h1>
					</div>

					{#if subtitle}
						<div class="rise-clip">
							<p
								class={cn(
									'rise rise-3 max-w-md text-sm md:text-base',
									sobreFoto ? 'text-white/85' : 'text-muted-foreground'
								)}
							>
								{subtitle}
							</p>
						</div>
					{/if}

					<div class="rise rise-3 flex flex-wrap gap-3 pt-2">
						<Button
							href="/tienda"
							size="lg"
							class={sobreFoto ? 'bg-white text-black hover:bg-white/90' : undefined}
						>
							Ver la tienda
						</Button>

						{#if collectionSlug}
							<Button
								href="/colecciones/{collectionSlug}"
								variant="outline"
								size="lg"
								class={sobreFoto
									? 'border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white'
									: undefined}
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
