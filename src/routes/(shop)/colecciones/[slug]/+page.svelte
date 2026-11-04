<script lang="ts">
	import type { PageData } from './$types';
	import CollectionShowcase from '$lib/components/organisms/CollectionShowcase.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const collection = $derived(data.collection);
</script>

<svelte:head>
	<title>{collection.name} — {data.settings.store_name}</title>
	<meta name="description" content={collection.description ?? collection.name} />
</svelte:head>

<CollectionShowcase
	name={collection.name}
	description={collection.description}
	imageUrl={collection.hero_image_url}
	items={collection.items}
	previewZone={data.draftPreview}
/>
