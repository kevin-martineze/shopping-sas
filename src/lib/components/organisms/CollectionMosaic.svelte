<script lang="ts">
	import type { Collection } from '$lib/domain/settings';

	import ProductImage from '$lib/components/molecules/ProductImage.svelte';

	interface Props {
		collections: Collection[];
	}

	let { collections }: Props = $props();
</script>

<!-- Una fila de mosaicos: foto y nombre. Hasta seis; en celular se desliza. -->
<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
	{#each collections as collection (collection.id)}
		<li>
			<a href="/colecciones/{collection.slug}" class="group block">
				<div class="bg-muted relative aspect-[3/4] overflow-hidden">
					{#if collection.hero_image_url}
						<ProductImage
							src={collection.hero_image_url}
							alt={collection.name}
							class="transition-transform duration-700 group-hover:scale-[1.03]"
						/>
					{/if}
				</div>
				<p class="mt-2 text-sm font-medium tracking-wide uppercase">{collection.name}</p>
			</a>
		</li>
	{/each}
</ul>
