<script lang="ts">
	import type { Color, Size, VariantOption } from '$lib/domain/catalog';

	import { cn } from '$lib/utils';

	interface Props {
		colors: Color[];
		sizes: Size[];
		variants: VariantOption[];
		selectedColorId: string | null;
		selectedSizeId: string | null;
		onselect: (next: { colorId: string | null; sizeId: string | null }) => void;
	}

	let { colors, sizes, variants, selectedColorId, selectedSizeId, onselect }: Props = $props();

	function stockFor(colorId: string | null, sizeId: string): number {
		if (!colorId) return 0;

		return (
			variants.find((variant) => variant.colorId === colorId && variant.sizeId === sizeId)?.stock ??
			0
		);
	}

	/** Un color se ofrece si al menos una de sus tallas tiene stock. */
	function colorHasStock(colorId: string): boolean {
		return variants.some((variant) => variant.colorId === colorId && variant.stock > 0);
	}
</script>

<div class="space-y-6">
	<section class="space-y-3">
		<div class="flex items-baseline justify-between">
			<p class="eyebrow">Color</p>
			<p class="text-muted-foreground text-xs">
				{colors.find((color) => color.id === selectedColorId)?.name ?? 'Elige un color'}
			</p>
		</div>

		<div class="flex flex-wrap gap-3">
			{#each colors as color (color.id)}
				{@const available = colorHasStock(color.id)}
				<button
					type="button"
					onclick={() => onselect({ colorId: color.id, sizeId: selectedSizeId })}
					aria-label={color.name}
					aria-pressed={selectedColorId === color.id}
					title={available ? color.name : `${color.name} — agotado`}
					class={cn(
						'relative size-8 rounded-full border transition-all',
						selectedColorId === color.id
							? 'ring-foreground ring-1 ring-offset-2'
							: 'border-border hover:ring-border hover:ring-1 hover:ring-offset-2',
						!available && 'opacity-40'
					)}
					style="background-color: {color.hex}"
				></button>
			{/each}
		</div>
	</section>

	<section class="space-y-3">
		<div class="flex items-baseline justify-between">
			<p class="eyebrow">Talla</p>
			<p class="text-muted-foreground text-xs">
				{sizes.find((size) => size.id === selectedSizeId)?.label ?? 'Elige una talla'}
			</p>
		</div>

		<div class="flex flex-wrap gap-2">
			{#each sizes as size (size.id)}
				{@const stock = stockFor(selectedColorId, size.id)}
				<button
					type="button"
					onclick={() => onselect({ colorId: selectedColorId, sizeId: size.id })}
					aria-pressed={selectedSizeId === size.id}
					class={cn(
						'border-border relative min-w-12 border px-4 py-2.5 text-sm transition-colors',
						selectedSizeId === size.id
							? 'bg-primary text-primary-foreground border-primary'
							: 'hover:bg-accent',
						stock === 0 && 'text-muted-foreground'
					)}
				>
					{size.label}

					{#if stock === 0}
						<!-- Talla agotada: se puede seleccionar para pedir aviso de reposición. -->
						<span class="bg-muted-foreground/60 pointer-events-none absolute inset-x-1 top-1/2 h-px"
						></span>
					{/if}
				</button>
			{/each}
		</div>

		{#if selectedColorId && selectedSizeId}
			{@const stock = stockFor(selectedColorId, selectedSizeId)}
			{#if stock > 0 && stock <= 3}
				<p class="text-sale text-xs">Quedan {stock} unidades.</p>
			{/if}
		{/if}
	</section>
</div>
