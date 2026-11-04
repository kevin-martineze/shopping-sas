<script lang="ts">
	import { untrack } from 'svelte';

	import type { PublicProductImage } from '$lib/domain/catalog';
	import type { DraftProduct } from '$lib/domain/preview';

	import type { PageData } from './$types';
	import * as Accordion from '$lib/components/atoms/accordion';
	import PriceTag from '$lib/components/molecules/PriceTag.svelte';
	import ProductGallery from '$lib/components/organisms/ProductGallery.svelte';
	import VariantPicker from '$lib/components/organisms/VariantPicker.svelte';
	import { draftImageUrl } from '$lib/stores/draft-image.svelte';
	import { storefrontDraft } from '$lib/stores/storefront-draft.svelte';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const product = $derived(data.product);

	/** El borrador del producto, si el panel está editando uno. */
	const draft = $derived.by((): DraftProduct | null => {
		const content = storefrontDraft.content;

		return content?.kind === 'product' ? content : null;
	});

	/** La foto recién elegida llega como `Blob`; la tienda la sirve con un `blob:`. */
	const draftPhoto = draftImageUrl(() => draft?.image ?? null);

	const name = $derived(draft ? draft.name : product.name);
	const description = $derived(draft ? draft.description : product.description);
	const price = $derived(draft ? draft.basePrice : product.basePrice);
	const compareAtPrice = $derived(draft ? draft.compareAtPrice : product.compareAtPrice);

	const categoryName = $derived.by(() => {
		if (!draft) return product.categoryName;
		if (!draft.categoryId) return null;

		return data.categories.find((category) => category.id === draft.categoryId)?.name ?? null;
	});

	/** El borrador manda su foto al principio; las demás siguen siendo las del producto. */
	const images = $derived.by((): PublicProductImage[] => {
		const current = draftPhoto.current;

		if (!current) return product.images;

		return [
			{
				id: 'borrador',
				option_value_id: null,
				url_full: current,
				url_card: current,
				url_thumb: current,
				lqip: null,
				alt: name,
				sort_order: -1
			},
			...product.images
		];
	});

	let selected = $state<Record<string, string>>(untrack(() => ({})));

	// Igual que la ficha de verdad: se arranca en la primera variante con stock.
	$effect(() => {
		const first = product.variants.find((variant) => variant.stock > 0) ?? product.variants.at(0);

		selected = Object.fromEntries(
			product.options.flatMap((option) => {
				const value = option.values.find((candidate) => first?.valueIds.includes(candidate.id));

				return value ? [[option.id, value.id] as const] : [];
			})
		);
	});
</script>

<svelte:head>
	<title>{name || 'Vista previa'} — {data.settings.store_name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
	<nav class="text-muted-foreground mb-8 flex items-center gap-2 text-xs">
		<span>Vista previa</span>
		{#if categoryName}
			<span>/</span>
			<span>{categoryName}</span>
		{/if}
	</nav>

	<div class="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16" data-preview-zone="product-card">
		<ProductGallery {images} productName={name} productSlug={product.slug} activeValueId={null} />

		<div class="lg:sticky lg:top-24 lg:self-start">
			<div class="space-y-8">
				<header class="space-y-3">
					<h1 class="text-4xl md:text-5xl">{name}</h1>
					<PriceTag {price} {compareAtPrice} size="lg" />
				</header>

				<VariantPicker
					options={product.options}
					variants={product.variants}
					{selected}
					onselect={(next) => (selected = next)}
				/>

				{#if description}
					<p class="text-muted-foreground text-sm leading-relaxed">{description}</p>
				{/if}

				<Accordion.Root type="single" class="border-border border-t">
					{#each product.attributes as attribute (attribute.name)}
						<Accordion.Item value={attribute.name}>
							<Accordion.Trigger>{attribute.name}</Accordion.Trigger>
							<Accordion.Content>{attribute.value}</Accordion.Content>
						</Accordion.Item>
					{/each}

					<Accordion.Item value="envios" data-preview-zone="prodhipping">
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
</div>
