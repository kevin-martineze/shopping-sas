<script lang="ts">
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import type { PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import * as Sheet from '$lib/components/atoms/sheet';
	import FilterPanel from '$lib/components/organisms/FilterPanel.svelte';
	import ProductGrid from '$lib/components/organisms/ProductGrid.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let filtersOpen = $state(false);

	const activeCategory = $derived(
		data.facets.categories.find((category) => category.slug === data.filters.category) ?? null
	);

	const title = $derived(
		data.filters.q
			? `Resultados para “${data.filters.q}”`
			: (activeCategory?.name ?? 'Toda la tienda')
	);

	const sortOptions = [
		{ value: 'nuevo', label: 'Más recientes' },
		{ value: 'precio-asc', label: 'Precio: menor a mayor' },
		{ value: 'precio-desc', label: 'Precio: mayor a menor' },
		{ value: 'nombre', label: 'Nombre A-Z' }
	];

	function changeSort(event: Event & { currentTarget: HTMLSelectElement }) {
		const url = new URL(page.url);
		url.searchParams.set('orden', event.currentTarget.value);
		url.searchParams.delete('pagina');

		goto(url, { keepFocus: true, noScroll: true });
	}

	function pageUrl(target: number): string {
		const url = new URL(page.url);
		url.searchParams.set('pagina', String(target));
		return `${url.pathname}${url.search}`;
	}
</script>

<svelte:head>
	<title>{title} — {data.settings.store_name}</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
	<header class="mb-8 space-y-2">
		<p class="eyebrow">Tienda</p>
		<h1 class="text-4xl md:text-5xl">{title}</h1>
		<p class="text-muted-foreground text-sm">
			{data.total}
			{data.total === 1 ? 'prenda' : 'prendas'}
		</p>
	</header>

	<div class="flex gap-10">
		<aside class="hidden w-56 flex-none lg:block">
			<div class="sticky top-24">
				<FilterPanel facets={data.facets} filters={data.filters} />
			</div>
		</aside>

		<div class="min-w-0 flex-1">
			<div class="mb-6 flex items-center justify-between gap-3">
				<Button
					type="button"
					variant="outline"
					size="sm"
					class="lg:hidden"
					onclick={() => (filtersOpen = true)}
				>
					<SlidersHorizontal class="mr-2 size-4" />
					Filtros
				</Button>

				<label class="ml-auto flex items-center gap-2 text-sm">
					<span class="text-muted-foreground hidden sm:inline">Ordenar por</span>
					<select
						value={data.filters.sort}
						onchange={changeSort}
						class="border-border bg-background focus-visible:ring-ring border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
					>
						{#each sortOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</label>
			</div>

			{#if data.products.length === 0}
				<div
					class="border-border flex flex-col items-center gap-4 border border-dashed px-6 py-24 text-center"
				>
					<h2 class="text-2xl">No encontramos prendas con esos filtros</h2>
					<p class="text-muted-foreground max-w-sm text-sm">
						Prueba quitando alguna talla o color, o mira el catálogo completo.
					</p>
					<Button href="/tienda" variant="outline">Ver todo</Button>
				</div>
			{:else}
				<ProductGrid products={data.products} columns={3} />
			{/if}

			{#if data.pageCount > 1}
				<nav class="mt-14 flex items-center justify-center gap-2" aria-label="Paginación">
					{#each Array.from({ length: data.pageCount }, (_, index) => index + 1) as target (target)}
						<a
							href={pageUrl(target)}
							aria-current={target === data.page ? 'page' : undefined}
							class="border-border grid size-10 place-items-center border text-sm transition-colors {target ===
							data.page
								? 'bg-primary text-primary-foreground border-primary'
								: 'hover:bg-accent'}"
						>
							{target}
						</a>
					{/each}
				</nav>
			{/if}
		</div>
	</div>
</div>

<Sheet.Root bind:open={filtersOpen}>
	<Sheet.Content side="left" class="w-80 overflow-y-auto">
		<Sheet.Header>
			<Sheet.Title class="font-display text-2xl">Filtros</Sheet.Title>
		</Sheet.Header>

		<div class="px-4 pb-10">
			<FilterPanel
				facets={data.facets}
				filters={data.filters}
				onapply={() => (filtersOpen = false)}
			/>
		</div>
	</Sheet.Content>
</Sheet.Root>
