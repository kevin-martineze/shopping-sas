<script lang="ts">
	import type { ProductOption, VariantOption } from '$lib/domain/catalog';

	import { cn } from '$lib/utils';

	/**
	 * Elegir una variante, sea cual sea el eje.
	 *
	 * Antes eran dos secciones fijas —color y variación— y eso ataba la tienda a la
	 * ropa. Ahora se pinta una sección por cada eje que el producto declare: una
	 * camisa enseña Color y Variación, un café Molienda y Peso, un libro nada.
	 *
	 * Los ejes con tono se pintan como muestras redondas; el resto, como
	 * botones con su texto. Es la misma distinción que hacía el diseño anterior,
	 * pero deducida del dato en vez de del nombre del eje.
	 */
	interface Props {
		options: ProductOption[];
		variants: VariantOption[];
		/** Un valor elegido por eje, indexado por id del eje. */
		selected: Record<string, string>;
		onselect: (next: Record<string, string>) => void;
	}

	let { options, variants, selected, onselect }: Props = $props();

	/**
	 * Si queda algo por vender con este valor, respetando lo ya elegido en los
	 * OTROS ejes.
	 *
	 * Mirar solo el valor diría "hay rojo" aunque el rojo solo exista en una
	 * variación que ya se descartó. Mirar todo lo elegido, incluido este eje, diría
	 * que nada está disponible en cuanto se elige algo agotado.
	 */
	function disponible(optionId: string, valueId: string): boolean {
		const otros = Object.entries(selected).filter(([eje]) => eje !== optionId);

		return variants.some(
			(variante) =>
				variante.stock > 0 &&
				variante.valueIds.includes(valueId) &&
				otros.every(([, elegido]) => variante.valueIds.includes(elegido))
		);
	}

	/** Un eje se pinta como muestras si TODOS sus valores traen tono. */
	function esColor(option: ProductOption): boolean {
		return option.values.length > 0 && option.values.every((valor) => valor.hex !== null);
	}

	function elegir(optionId: string, valueId: string) {
		onselect({ ...selected, [optionId]: valueId });
	}
</script>

<div class="space-y-6">
	{#each options as option (option.id)}
		{@const elegido = selected[option.id]}

		<section class="space-y-3">
			<div class="flex items-baseline justify-between">
				<p class="eyebrow">{option.name}</p>
				<p class="text-muted-foreground text-xs">
					{option.values.find((valor) => valor.id === elegido)?.value ??
						`Elige ${option.name.toLowerCase()}`}
				</p>
			</div>

			{#if esColor(option)}
				<div class="flex flex-wrap gap-3">
					{#each option.values as valor (valor.id)}
						{@const hay = disponible(option.id, valor.id)}
						<button
							type="button"
							onclick={() => elegir(option.id, valor.id)}
							aria-label={valor.value}
							aria-pressed={elegido === valor.id}
							title={hay ? valor.value : `${valor.value} — agotado`}
							class={cn(
								'relative size-8 rounded-full border transition-all',
								elegido === valor.id
									? 'ring-foreground ring-1 ring-offset-2'
									: 'border-border hover:ring-border hover:ring-1 hover:ring-offset-2',
								!hay && 'opacity-40'
							)}
							style="background-color: {valor.hex}"
						></button>
					{/each}
				</div>
			{:else}
				<div class="flex flex-wrap gap-2">
					{#each option.values as valor (valor.id)}
						{@const hay = disponible(option.id, valor.id)}
						<button
							type="button"
							onclick={() => elegir(option.id, valor.id)}
							disabled={!hay}
							aria-pressed={elegido === valor.id}
							title={hay ? valor.value : `${valor.value} — agotado`}
							class={cn(
								'min-w-12 rounded-md border px-3 py-2 text-sm transition-colors',
								elegido === valor.id
									? 'border-foreground bg-foreground text-background'
									: 'border-border hover:border-foreground/40',
								!hay && 'text-muted-foreground line-through opacity-50'
							)}
						>
							{valor.value}
						</button>
					{/each}
				</div>
			{/if}
		</section>
	{/each}
</div>
