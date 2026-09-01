<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import * as Table from '$lib/components/atoms/table';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import NumberField from '$lib/components/molecules/NumberField.svelte';

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

<FormFeedback error={form?.error ?? null} />

{#if data.groups.length === 0}
	<Card.Root>
		<Card.Content class="text-muted-foreground py-16 text-center text-sm">
			{data.onlyLow ? 'Nada con stock bajo.' : 'Todavía no hay variantes creadas.'}
		</Card.Content>
	</Card.Root>
{:else}
	<div class="space-y-6">
		{#each data.groups as group (group.id)}
			<Card.Root>
				<Card.Header>
					<div class="flex items-center justify-between gap-3">
						<Card.Title>
							<a href="/admin/productos/{group.id}" class="hover:underline">{group.name}</a>
						</Card.Title>
						<Card.Description>
							{group.rows.reduce((sum, row) => sum + row.stock, 0)} unidades
						</Card.Description>
					</div>
				</Card.Header>

				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-10"></Table.Head>
								<Table.Head>Color</Table.Head>
								<Table.Head class="w-20">Talla</Table.Head>
								<Table.Head>Referencia</Table.Head>
								<Table.Head class="w-44">Stock</Table.Head>
								<Table.Head class="w-28"></Table.Head>
							</Table.Row>
						</Table.Header>

						<Table.Body>
							{#each group.rows as row (row.id)}
								<Table.Row>
									<Table.Cell>
										<span
											class="border-border block size-3.5 rounded-full border"
											style="background-color: {row.colors?.hex ?? 'transparent'}"
											title={row.colors?.name ?? ''}
										></span>
									</Table.Cell>

									<Table.Cell class="text-sm">
										{row.colors?.name ?? '—'}
										{#if !row.active}
											<span class="text-muted-foreground text-xs">· inactiva</span>
										{/if}
									</Table.Cell>

									<Table.Cell class="text-sm font-medium">{row.sizes?.label ?? '—'}</Table.Cell>

									<Table.Cell class="text-muted-foreground font-mono text-xs">
										{row.sku ?? ''}
									</Table.Cell>

									<Table.Cell>
										<NumberField
											form="stock-{row.id}"
											name="stock"
											value={row.stock}
											invalid={row.stock === 0}
											aria-label="Stock de {row.colors?.name} talla {row.sizes?.label}"
										/>
									</Table.Cell>

									<Table.Cell>
										<Button type="submit" form="stock-{row.id}" size="sm" variant="outline">
											Guardar
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
{/if}

<!-- El HTML no admite <form> dentro de <tbody>: viven aquí y se referencian por id. -->
<div hidden>
	{#each data.groups as group (group.id)}
		{#each group.rows as row (row.id)}
			<form id="stock-{row.id}" method="POST" action="?/stock" use:enhance>
				<input type="hidden" name="variantId" value={row.id} />
			</form>
		{/each}
	{/each}
</div>
