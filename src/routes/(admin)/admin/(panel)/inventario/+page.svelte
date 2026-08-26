<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();
</script>

<svelte:head>
	<title>Inventario — Panel</title>
</svelte:head>

<header class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-3xl">Inventario</h1>
		<p class="text-muted-foreground text-sm">
			Edita el stock de cada talla. Los pedidos lo descuentan solos.
		</p>
	</div>

	<div class="flex gap-2">
		<Button href="/admin/inventario" variant={data.onlyLow ? 'outline' : 'default'} size="sm">
			Todo
		</Button>
		<Button
			href="/admin/inventario?bajo=1"
			variant={data.onlyLow ? 'default' : 'outline'}
			size="sm"
		>
			Stock bajo
		</Button>
	</div>
</header>

{#if form?.error}
	<p class="text-destructive mb-4 text-sm">{form.error}</p>
{/if}

{#if data.groups.length === 0}
	<p
		class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
	>
		{data.onlyLow ? 'Nada con stock bajo.' : 'Todavía no hay variantes creadas.'}
	</p>
{:else}
	<div class="space-y-6">
		{#each data.groups as group (group.id)}
			<section class="border-border bg-background border">
				<header class="border-border flex items-center justify-between border-b px-4 py-3">
					<a href="/admin/productos/{group.id}" class="text-sm font-medium">{group.name}</a>
					<span class="text-muted-foreground text-xs">
						{group.rows.reduce((sum, row) => sum + row.stock, 0)} unidades
					</span>
				</header>

				<div class="divide-border divide-y">
					{#each group.rows as row (row.id)}
						<form
							method="POST"
							action="?/stock"
							class="flex flex-wrap items-center gap-3 px-4 py-2.5"
							use:enhance
						>
							<input type="hidden" name="variantId" value={row.id} />

							<span
								class="border-border size-3.5 flex-none rounded-full border"
								style="background-color: {row.colors?.hex ?? 'transparent'}"
								title={row.colors?.name ?? ''}
							></span>

							<span class="w-28 truncate text-sm">{row.colors?.name ?? '—'}</span>
							<span class="w-12 text-sm font-medium">{row.sizes?.label ?? '—'}</span>
							<span class="text-muted-foreground w-40 truncate text-xs">{row.sku ?? ''}</span>

							{#if !row.active}
								<span class="text-muted-foreground text-xs">inactiva</span>
							{/if}

							<div class="ml-auto flex items-center gap-2">
								<Input
									name="stock"
									type="number"
									min="0"
									max="9999"
									value={row.stock}
									class="w-24 {row.stock === 0 ? 'border-destructive' : ''}"
									aria-label="Stock de {row.colors?.name} talla {row.sizes?.label}"
								/>
								<Button type="submit" size="sm" variant="outline">Guardar</Button>
							</div>
						</form>
					{/each}
				</div>
			</section>
		{/each}
	</div>
{/if}
