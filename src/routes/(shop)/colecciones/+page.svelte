<script lang="ts">
	import type { PageData } from './$types';
	import { reveal } from '$lib/actions/reveal';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Colecciones — {data.settings.store_name}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
	<header class="mb-12 space-y-2">
		<p class="eyebrow">Editorial</p>
		<h1 class="text-4xl md:text-5xl">Colecciones</h1>
	</header>

	{#if data.collections.length === 0}
		<p class="text-muted-foreground">Todavía no hay colecciones publicadas.</p>
	{:else}
		<div class="grid gap-8 md:grid-cols-2">
			{#each data.collections as collection, index (collection.id)}
				<a
					href="/colecciones/{collection.slug}"
					class="group block"
					use:reveal={{ delay: (index % 2) * 80 }}
				>
					<div class="bg-muted relative aspect-[4/5] overflow-hidden">
						{#if collection.hero_image_url}
							<img
								src={collection.hero_image_url}
								alt={collection.name}
								loading="lazy"
								class="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-editorial)] group-hover:scale-[1.03]"
							/>
						{/if}
						<div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>

						<div class="absolute bottom-0 space-y-1 p-6 text-white">
							<h2 class="text-3xl">{collection.name}</h2>
							{#if collection.description}
								<p class="max-w-sm text-sm text-white/85">{collection.description}</p>
							{/if}
						</div>
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>
