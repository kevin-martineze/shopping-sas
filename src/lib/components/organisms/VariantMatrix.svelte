<script lang="ts">
	import type { Color, Size } from '$lib/domain/catalog';
	import type { AdminVariantRow } from '$lib/server/admin';

	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import { Checkbox } from '$lib/components/atoms/checkbox';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
	import NumberField from '$lib/components/molecules/NumberField.svelte';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		colors: Color[];
		sizes: Size[];
		variants: AdminVariantRow[];
		basePrice: number;
	}

	let { colors, sizes, variants, basePrice }: Props = $props();

	let selectedColors = $state<string[]>([]);
	let selectedSizes = $state<string[]>([]);
	let defaultStock = $state(0);

	interface ColorGroup {
		colorId: string;
		color: AdminVariantRow['colors'];
		rows: AdminVariantRow[];
	}

	// Agrupa por color para que la matriz se lea como el perchero real.
	const grouped = $derived.by(() => {
		const groups: ColorGroup[] = [];

		for (const variant of variants) {
			const existing = groups.find((group) => group.colorId === variant.color_id);

			if (existing) existing.rows.push(variant);
			else groups.push({ colorId: variant.color_id, color: variant.colors, rows: [variant] });
		}

		for (const group of groups) {
			group.rows.sort((a, b) => (a.sizes?.sort_order ?? 0) - (b.sizes?.sort_order ?? 0));
		}

		return groups;
	});

	function toggle(list: string[], id: string, checked: boolean): string[] {
		return checked ? [...new Set([...list, id])] : list.filter((item) => item !== id);
	}
</script>

<div class="space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>Crear combinaciones</Card.Title>
			<Card.Description>
				Elige colores y tallas: se crean las que falten, sin tocar las existentes.
			</Card.Description>
		</Card.Header>

		<Card.Content>
			<form method="POST" action="?/variantes" class="space-y-5" use:enhance>
				<div class="grid gap-6 sm:grid-cols-2">
					<div class="space-y-2">
						<p class="text-sm font-medium">Colores</p>
						{#each colors as color (color.id)}
							<div class="flex items-center gap-2">
								<Checkbox
									id="matrix-color-{color.id}"
									name="colorIds"
									value={color.id}
									checked={selectedColors.includes(color.id)}
									onCheckedChange={(checked) => {
										selectedColors = toggle(selectedColors, color.id, checked === true);
									}}
								/>
								<Label for="matrix-color-{color.id}" class="flex items-center gap-2 text-sm">
									<span
										class="border-border size-3.5 rounded-full border"
										style="background-color: {color.hex}"
									></span>
									{color.name}
								</Label>
							</div>
						{/each}
					</div>

					<div class="space-y-2">
						<p class="text-sm font-medium">Tallas</p>
						{#each sizes as size (size.id)}
							<div class="flex items-center gap-2">
								<Checkbox
									id="matrix-size-{size.id}"
									name="sizeIds"
									value={size.id}
									checked={selectedSizes.includes(size.id)}
									onCheckedChange={(checked) => {
										selectedSizes = toggle(selectedSizes, size.id, checked === true);
									}}
								/>
								<Label for="matrix-size-{size.id}" class="text-sm">{size.label}</Label>
							</div>
						{/each}
					</div>
				</div>

				<div class="flex flex-wrap items-end gap-3">
					<div class="space-y-1.5">
						<Label class="text-xs" for="defaultStock">Stock inicial</Label>
						<NumberField
							id="defaultStock"
							name="defaultStock"
							bind:value={defaultStock}
							class="w-36"
						/>
					</div>

					<Button
						type="submit"
						disabled={selectedColors.length === 0 || selectedSizes.length === 0}
					>
						Crear {selectedColors.length * selectedSizes.length || ''} combinaciones
					</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>

	{#if grouped.length === 0}
		<Card.Root>
			<Card.Content class="text-muted-foreground py-12 text-center text-sm">
				Esta prenda todavía no tiene tallas. Créalas arriba para poder venderla.
			</Card.Content>
		</Card.Root>
	{:else}
		{#each grouped as group (group.colorId)}
			<Card.Root>
				<Card.Header>
					<div class="flex items-center gap-2">
						<span
							class="border-border size-4 rounded-full border"
							style="background-color: {group.color?.hex ?? 'transparent'}"
						></span>
						<Card.Title class="text-base">{group.color?.name ?? 'Sin color'}</Card.Title>
					</div>
				</Card.Header>

				<Card.Content>
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-20">Talla</Table.Head>
								<Table.Head class="w-44">Stock</Table.Head>
								<Table.Head class="w-48">Precio propio</Table.Head>
								<Table.Head>Se vende a</Table.Head>
								<Table.Head class="w-28">Activa</Table.Head>
								<Table.Head class="w-36"></Table.Head>
							</Table.Row>
						</Table.Header>

						<Table.Body>
							{#each group.rows as variant (`${variant.id}:${variant.active}`)}
								<Table.Row>
									<Table.Cell class="text-sm font-medium">{variant.sizes?.label ?? '—'}</Table.Cell>

									<Table.Cell>
										<NumberField
											form="variante-{variant.id}"
											name="stock"
											value={variant.stock}
											invalid={variant.stock === 0}
											aria-label="Stock"
										/>
									</Table.Cell>

									<Table.Cell>
										<NumberField
											form="variante-{variant.id}"
											name="priceOverride"
											value={variant.price_override ?? basePrice}
											step={1000}
											max={100000000}
											aria-label="Precio propio"
										/>
									</Table.Cell>

									<Table.Cell class="text-muted-foreground text-sm tabular-nums">
										{formatMoney(variant.price_override ?? basePrice)}
									</Table.Cell>

									<Table.Cell>
										<CheckboxField
											id="variante-activa-{variant.id}"
											form="variante-{variant.id}"
											name="active"
											label="Activa"
											checked={variant.active}
										/>
									</Table.Cell>

									<Table.Cell>
										<div class="flex items-center gap-1">
											<Button
												type="submit"
												form="variante-{variant.id}"
												size="sm"
												variant="outline"
											>
												Guardar
											</Button>

											{#if variant.stock === 0 && !variant.active}
												<Button
													type="submit"
													form="borrar-variante-{variant.id}"
													size="sm"
													variant="ghost"
													class="text-destructive"
													aria-label="Borrar talla {variant.sizes?.label}"
												>
													<Trash2 class="size-3" />
												</Button>
											{/if}
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		{/each}
	{/if}
</div>

<!-- El HTML no admite <form> dentro de <tbody>: viven aquí y se referencian por id. -->
<div hidden>
	{#each variants as variant (variant.id)}
		<form id="variante-{variant.id}" method="POST" action="?/stock" use:enhance>
			<input type="hidden" name="variantId" value={variant.id} />
		</form>

		<form id="borrar-variante-{variant.id}" method="POST" action="?/borrarVariante" use:enhance>
			<input type="hidden" name="variantId" value={variant.id} />
		</form>
	{/each}
</div>
