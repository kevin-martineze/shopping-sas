<script lang="ts">
	import type { DraftCollection } from '$lib/domain/preview';

	import type { PageData } from './$types';
	import CollectionShowcase from '$lib/components/organisms/CollectionShowcase.svelte';
	import { draftImageUrl } from '$lib/stores/draft-image.svelte';
	import { storefrontDraft } from '$lib/stores/storefront-draft.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const draft = $derived.by((): DraftCollection | null => {
		const content = storefrontDraft.content;

		return content?.kind === 'collection' ? content : null;
	});

	/** La foto recién elegida, servida desde el navegador mientras se edita. */
	const image = draftImageUrl(() => draft?.image ?? null);

	const base = $derived(data.collection);

	const view = $derived.by(() => {
		if (!draft) {
			return {
				name: base?.name ?? 'Tu colección',
				description: base?.description ?? null,
				imageUrl: base?.hero_image_url ?? null,
				items: base?.items ?? []
			};
		}

		// El borrador manda entero: lo que no trae, no se muestra. Así una
		// colección nueva no hereda la foto ni los productos de otra.
		return {
			name: draft.name.trim() || 'Tu colección',
			description: draft.description.trim() ? draft.description : null,
			imageUrl: image.current,
			items: draft.items.flatMap((item) => {
				const found = base?.items.find((candidate) => candidate.product.id === item.productId);

				return found
					? [{ product: found.product, hotspotX: item.hotspotX, hotspotY: item.hotspotY }]
					: [];
			})
		};
	});
</script>

<svelte:head>
	<title>{view.name} — {data.settings.store_name}</title>
</svelte:head>

<CollectionShowcase
	name={view.name}
	description={view.description}
	imageUrl={view.imageUrl}
	items={view.items}
	previewZone
/>
