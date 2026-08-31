<script lang="ts">
	import type { Color, Size } from '$lib/domain/catalog';
	import type { AdminVariantRow } from '$lib/server/admin';

	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import { Button } from '$lib/components/atoms/button';
	import { Checkbox } from '$lib/components/atoms/checkbox';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
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

<div class="space-y-8">
	<section class="border-border space-y-4 border p-4">
		<div>
			<h3 class="text-lg">Crear combinaciones</h3>
			<p class="text-muted-foreground text-sm">
				Elige colores y tallas: se crean las que falten, sin tocar las existentes.
			</p>
		</div>

		<form method="POST" action="?/variantes" class="space-y-4" use:enhance>
			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<p class="eyebrow">Colores</p>
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
					<p class="eyebrow">Tallas</p>
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
				<div class="space-y-2">
					<Label for="defaultStock">Stock inicial</Label>
					<Input
						id="defaultStock"
						name="defaultStock"
						type="number"
						min="0"
						max="9999"
						bind:value={defaultStock}
						class="w-28"
					/>
				</div>

				<Button
					type="submit"
					variant="outline"
					disabled={selectedColors.length === 0 || selectedSizes.length === 0}
				>
					Crear {selectedColors.length * selectedSizes.length || ''} combinaciones
				</Button>
			</div>
		</form>
	</section>

	{#if grouped.length === 0}
		<p class="text-muted-foreground text-sm">
			Esta prenda todavía no tiene tallas. Créalas arriba para poder venderla.
		</p>
	{:else}
		<div class="space-y-6">
			{#each grouped as group (group.colorId)}
				<section class="space-y-3">
					<div class="flex items-center gap-2">
						<span
							class="border-border size-4 rounded-full border"
							style="background-color: {group.color?.hex ?? 'transparent'}"
						></span>
						<h4 class="text-sm font-medium">{group.color?.name ?? 'Sin color'}</h4>
					</div>

					<div class="border-border bg-background divide-border divide-y border">
						{#each group.rows as variant (variant.id)}
							<form
								method="POST"
								action="?/stock"
								class="flex flex-wrap items-center gap-3 p-3"
								use:enhance
							>
								<input type="hidden" name="variantId" value={variant.id} />

								<span class="w-12 text-sm font-medium">{variant.sizes?.label ?? '—'}</span>

								<label class="flex items-center gap-2 text-xs">
									<span class="text-muted-foreground">Stock</span>
									<Input
										name="stock"
										type="number"
										min="0"
										max="9999"
										value={variant.stock}
										class="w-20"
									/>
								</label>

								<label class="flex items-center gap-2 text-xs">
									<span class="text-muted-foreground">Precio propio</span>
									<Input
										name="priceOverride"
										type="number"
										min="0"
										step="1000"
										value={variant.price_override ?? ''}
										placeholder={String(basePrice)}
										class="w-32"
									/>
								</label>

								<span class="text-muted-foreground text-xs">
									{formatMoney(variant.price_override ?? basePrice)}
								</span>

								<CheckboxField
									id="variante-activa-{variant.id}"
									name="active"
									label="Activa"
									checked={variant.active}
								/>

								<div class="ml-auto flex items-center gap-2">
									<Button type="submit" size="sm" variant="outline">Guardar</Button>
								</div>
							</form>
						{/each}
					</div>

					<form method="POST" action="?/borrarVariante" use:enhance class="flex justify-end">
						{#each group.rows.filter((row) => row.stock === 0 && !row.active) as variant (variant.id)}
							<Button
								type="submit"
								name="variantId"
								value={variant.id}
								size="sm"
								variant="ghost"
								class="text-destructive"
							>
								<Trash2 class="mr-1 size-3" />
								Borrar {variant.sizes?.label}
							</Button>
						{/each}
					</form>
				</section>
			{/each}
		</div>
	{/if}
</div>
