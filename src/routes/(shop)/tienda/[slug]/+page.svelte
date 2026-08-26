<script lang="ts">
	import BellRing from '@lucide/svelte/icons/bell-ring';
	import Heart from '@lucide/svelte/icons/heart';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';

	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';

	import type { ActionData, PageData } from './$types';
	import * as Accordion from '$lib/components/atoms/accordion';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import PriceTag from '$lib/components/molecules/PriceTag.svelte';
	import ProductGallery from '$lib/components/organisms/ProductGallery.svelte';
	import ProductGrid from '$lib/components/organisms/ProductGrid.svelte';
	import VariantPicker from '$lib/components/organisms/VariantPicker.svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { cn } from '$lib/utils';
	import { formatMoney } from '$lib/utils/money';
	import { buildProductInquiryUrl } from '$lib/utils/whatsapp';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	const product = $derived(data.product);

	let selectedColorId = $state<string | null>(null);
	let selectedSizeId = $state<string | null>(null);
	let restockContact = $state('');
	let submittingRestock = $state(false);

	// Al cambiar de prenda se reinicia la selección al primer color con stock.
	$effect(() => {
		const firstAvailable =
			product.colors.find((color) =>
				product.variants.some((variant) => variant.colorId === color.id && variant.stock > 0)
			) ?? product.colors.at(0);

		selectedColorId = firstAvailable?.id ?? null;
		selectedSizeId = null;
	});

	const selectedVariant = $derived(
		product.variants.find(
			(variant) => variant.colorId === selectedColorId && variant.sizeId === selectedSizeId
		) ?? null
	);

	const price = $derived(selectedVariant?.price ?? product.basePrice);
	const isFavorite = $derived(favorites.has(product.slug));
	const outOfStock = $derived(selectedVariant !== null && selectedVariant.stock === 0);
	const productUrl = $derived(new URL(`/tienda/${product.slug}`, page.url.origin).toString());

	const inquiryUrl = $derived(
		buildProductInquiryUrl(
			data.settings.whatsapp_phone,
			data.settings.store_name,
			product.name,
			productUrl
		)
	);

	function addToCart() {
		if (!selectedVariant || selectedVariant.stock === 0) {
			toast.error('Elige color y talla disponibles.');
			return;
		}

		const color = product.colors.find((item) => item.id === selectedColorId);
		const size = product.sizes.find((item) => item.id === selectedSizeId);
		const image =
			product.images.find((item) => item.color_id === selectedColorId) ?? product.images.at(0);

		cart.add({
			variantId: selectedVariant.id,
			qty: 1,
			preview: {
				productName: product.name,
				productSlug: product.slug,
				colorName: color?.name ?? '',
				sizeLabel: size?.label ?? '',
				unitPrice: selectedVariant.price,
				imageUrl: image?.url_thumb ?? null
			}
		});

		toast.success('Agregado al carrito');
	}

	// Escapar `<` evita que una descripción con HTML cierre la etiqueta script.
	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Product',
			name: product.name,
			description: product.description ?? undefined,
			image: product.images.map((image) => image.url_full),
			offers: {
				'@type': 'Offer',
				price: product.basePrice,
				priceCurrency: 'COP',
				availability: product.variants.some((variant) => variant.stock > 0)
					? 'https://schema.org/InStock'
					: 'https://schema.org/OutOfStock',
				url: productUrl
			}
		}).replace(/</g, '\u003c')
	);
</script>

<svelte:head>
	<title>{product.name} — {data.settings.store_name}</title>
	<meta name="description" content={product.description ?? product.name} />
	<meta property="og:title" content={product.name} />
	<meta property="og:type" content="product" />
	{#if product.images.at(0)}
		<meta property="og:image" content={product.images[0].url_full} />
	{/if}
	<!-- eslint-disable-next-line svelte/no-at-html-tags, no-useless-escape -- JSON-LD propio, con `<` ya escapado -->
	{@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
	<nav class="text-muted-foreground mb-8 flex items-center gap-2 text-xs">
		<a href="/tienda" class="hover:text-foreground">Tienda</a>
		{#if product.categorySlug}
			<span>/</span>
			<a href="/tienda?categoria={product.categorySlug}" class="hover:text-foreground">
				{product.categoryName}
			</a>
		{/if}
	</nav>

	<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
		<ProductGallery
			images={product.images}
			productName={product.name}
			activeColorId={selectedColorId}
		/>

		<div class="lg:sticky lg:top-24 lg:self-start">
			<div class="space-y-8">
				<header class="space-y-3">
					<h1 class="text-4xl md:text-5xl">{product.name}</h1>
					<PriceTag {price} compareAtPrice={product.compareAtPrice} size="lg" />
				</header>

				<VariantPicker
					colors={product.colors}
					sizes={product.sizes}
					variants={product.variants}
					{selectedColorId}
					{selectedSizeId}
					onselect={(next) => {
						selectedColorId = next.colorId;
						selectedSizeId = next.sizeId;
					}}
				/>

				<div class="space-y-3">
					{#if outOfStock}
						<div class="border-border space-y-3 border p-4">
							<div class="flex items-center gap-2">
								<BellRing class="size-4" />
								<p class="text-sm font-medium">Esta talla está agotada</p>
							</div>

							{#if form?.restockOk}
								<p class="text-success text-sm">
									Listo. Te avisamos por este contacto cuando vuelva.
								</p>
							{:else}
								<form
									method="POST"
									action="?/avisarme"
									class="flex gap-2"
									use:enhance={() => {
										submittingRestock = true;

										return async ({ update }) => {
											await update();
											submittingRestock = false;
											restockContact = '';
										};
									}}
								>
									<input type="hidden" name="variantId" value={selectedVariant?.id ?? ''} />
									<Input
										name="contact"
										bind:value={restockContact}
										placeholder="Tu WhatsApp o correo"
										aria-label="Contacto para avisarte"
										required
									/>
									<Button type="submit" variant="outline" disabled={submittingRestock}>
										Avísame
									</Button>
								</form>

								{#if form?.restockError}
									<p class="text-destructive text-xs">{form.restockError}</p>
								{/if}
							{/if}
						</div>
					{:else}
						<Button
							type="button"
							size="lg"
							class="w-full"
							onclick={addToCart}
							disabled={selectedVariant === null}
						>
							<ShoppingBag class="mr-2 size-4" />
							{selectedVariant ? `Agregar — ${formatMoney(price)}` : 'Elige talla'}
						</Button>
					{/if}

					<div class="grid grid-cols-2 gap-3">
						<Button
							type="button"
							variant="outline"
							onclick={() => favorites.toggle(product.slug)}
							aria-pressed={isFavorite}
						>
							<Heart class={cn('mr-2 size-4', isFavorite && 'fill-foreground')} />
							{isFavorite ? 'Guardado' : 'Guardar'}
						</Button>

						<Button href={inquiryUrl} target="_blank" rel="noopener noreferrer" variant="outline">
							<MessageCircle class="mr-2 size-4" />
							Preguntar
						</Button>
					</div>
				</div>

				{#if product.description}
					<p class="text-muted-foreground text-sm leading-relaxed">{product.description}</p>
				{/if}

				<Accordion.Root type="single" class="border-border border-t">
					{#if product.material}
						<Accordion.Item value="material">
							<Accordion.Trigger>Materiales</Accordion.Trigger>
							<Accordion.Content>{product.material}</Accordion.Content>
						</Accordion.Item>
					{/if}

					{#if product.care}
						<Accordion.Item value="cuidados">
							<Accordion.Trigger>Cuidados</Accordion.Trigger>
							<Accordion.Content>{product.care}</Accordion.Content>
						</Accordion.Item>
					{/if}

					<Accordion.Item value="envios">
						<Accordion.Trigger>Envíos y pedido</Accordion.Trigger>
						<Accordion.Content>
							El pedido se confirma por WhatsApp. Elegimos juntos la forma de pago y el envío según
							tu ciudad.
							{#if data.settings.free_shipping_threshold}
								Envío gratis desde {formatMoney(data.settings.free_shipping_threshold)}.
							{/if}
						</Accordion.Content>
					</Accordion.Item>
				</Accordion.Root>
			</div>
		</div>
	</div>

	{#if data.related.length > 0}
		<section class="mt-24">
			<h2 class="mb-8 text-2xl md:text-3xl">También te puede gustar</h2>
			<ProductGrid products={data.related} />
		</section>
	{/if}
</div>

<!-- Barra fija de compra en móvil: el botón siempre a mano. -->
{#if !outOfStock}
	<div
		class="bg-background/95 border-border fixed inset-x-0 bottom-0 z-30 border-t p-3 backdrop-blur lg:hidden"
	>
		<Button
			type="button"
			class="w-full"
			size="lg"
			onclick={addToCart}
			disabled={selectedVariant === null}
		>
			<ShoppingBag class="mr-2 size-4" />
			{selectedVariant ? `Agregar — ${formatMoney(price)}` : 'Elige talla'}
		</Button>
	</div>
{/if}
