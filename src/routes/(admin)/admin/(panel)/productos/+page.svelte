<script lang="ts">
	import { untrack } from 'svelte';

	import Plus from '@lucide/svelte/icons/plus';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import type { PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import * as Table from '$lib/components/atoms/table';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Valor inicial del buscador: la URL manda a partir de aquí.
	let search = $state(untrack(() => data.search ?? ''));

	const statusLabel = {
		draft: 'Borrador',
		active: 'Publicado',
		archived: 'Archivado'
	};

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();

		const url = new URL(page.url);
		const term = search.trim();

		if (term) url.searchParams.set('q', term);
		else url.searchParams.delete('q');

		goto(url, { keepFocus: true, noScroll: true });
	}

	function totalStock(variants: { stock: number }[]): number {
		return variants.reduce((sum, variant) => sum + variant.stock, 0);
	}
</script>

<svelte:head>
	<title>Productos — Panel</title>
</svelte:head>

<header class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-3xl">Productos</h1>
		<p class="text-muted-foreground text-sm">{data.products.length} prendas.</p>
	</div>

	<div class="flex items-center gap-2">
		<form onsubmit={submitSearch} class="flex gap-2">
			<Input bind:value={search} placeholder="Buscar prenda" class="w-48" />
			<Button type="submit" variant="outline">Buscar</Button>
		</form>

		<Button href="/admin/productos/nuevo">
			<Plus class="mr-2 size-4" />
			Nueva prenda
		</Button>
	</div>
</header>

{#if data.products.length === 0}
	<div
		class="border-border flex flex-col items-center gap-3 border border-dashed px-6 py-20 text-center"
	>
		<h2 class="text-xl">Todavía no hay prendas</h2>
		<p class="text-muted-foreground max-w-sm text-sm">
			Crea la primera: nombre, precio, fotos y las tallas con su inventario.
		</p>
		<Button href="/admin/productos/nuevo">Crear prenda</Button>
	</div>
{:else}
	<div class="border-border bg-background border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-16"></Table.Head>
					<Table.Head>Prenda</Table.Head>
					<Table.Head>Categoría</Table.Head>
					<Table.Head>Precio</Table.Head>
					<Table.Head>Stock</Table.Head>
					<Table.Head>Estado</Table.Head>
				</Table.Row>
			</Table.Header>

			<Table.Body>
				{#each data.products as product (product.id)}
					{@const image = [...product.product_images].sort(
						(a, b) => a.sort_order - b.sort_order
					)[0]}
					{@const stock = totalStock(product.variants)}
					<Table.Row>
						<Table.Cell>
							{#if image}
								<img src={image.url_thumb} alt="" class="bg-muted size-12 object-cover" />
							{:else}
								<div class="bg-muted size-12"></div>
							{/if}
						</Table.Cell>

						<Table.Cell>
							<a href="/admin/productos/{product.id}" class="font-medium">{product.name}</a>
							<p class="text-muted-foreground text-xs">/{product.slug}</p>
						</Table.Cell>

						<Table.Cell class="text-muted-foreground text-sm">
							{product.categories?.name ?? '—'}
						</Table.Cell>

						<Table.Cell class="tabular-nums">{formatMoney(product.base_price)}</Table.Cell>

						<Table.Cell>
							<span class={stock === 0 ? 'text-destructive' : stock <= 5 ? 'text-sale' : ''}>
								{stock}
							</span>
						</Table.Cell>

						<Table.Cell>
							<Badge variant={product.status === 'active' ? 'secondary' : 'outline'}>
								{statusLabel[product.status]}
							</Badge>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>
{/if}
