<script lang="ts">
	import type { CatalogFacets, ProductFilters } from '$lib/domain/catalog';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { Button } from '$lib/components/atoms/button';
	import { Checkbox } from '$lib/components/atoms/checkbox';
	import { Label } from '$lib/components/atoms/label';
	import { Separator } from '$lib/components/atoms/separator';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		facets: CatalogFacets;
		filters: ProductFilters;
		onapply?: () => void;
	}

	let { facets, filters, onapply }: Props = $props();

	/**
	 * Los filtros viven en la URL, no en estado local: así funcionan el
	 * atrás/adelante del navegador, el refresh y compartir el enlace.
	 */
	function updateUrl(mutate: (params: URLSearchParams) => void) {
		const url = new URL(page.url);
		mutate(url.searchParams);
		url.searchParams.delete('pagina');

		goto(url, { keepFocus: true, noScroll: true });
		onapply?.();
	}

	function toggleMulti(key: string, value: string, checked: boolean) {
		updateUrl((params) => {
			const current = params.getAll(key).filter((item) => item !== value);
			params.delete(key);

			for (const item of current) params.append(key, item);
			if (checked) params.append(key, value);
		});
	}

	function setCategory(slug: string | null) {
		updateUrl((params) => {
			if (slug) params.set('categoria', slug);
			else params.delete('categoria');
		});
	}

	function setPriceCap(max: number | null) {
		updateUrl((params) => {
			if (max) params.set('max', String(max));
			else params.delete('max');
		});
	}

	function clearAll() {
		goto('/tienda', { keepFocus: true, noScroll: true });
		onapply?.();
	}

	const priceSteps = $derived.by(() => {
		const { min, max } = facets.priceRange;
		if (max <= min) return [];

		const span = max - min;
		return [0.33, 0.66, 1].map((factor) => Math.ceil((min + span * factor) / 10000) * 10000);
	});

	const hasFilters = $derived(
		filters.category !== null ||
			filters.options.length > 0 ||
			filters.maxPrice !== null ||
			filters.q !== null
	);

	/** Un eje se pinta como muestras si TODOS sus valores traen tono. */
	function esColor(option: CatalogFacets['options'][number]): boolean {
		return option.values.length > 0 && option.values.every((valor) => valor.hex !== null);
	}
</script>

<div class="space-y-6">
	<section class="space-y-3">
		<p class="eyebrow">Categoría</p>

		<div class="flex flex-col items-start gap-2">
			<button
				type="button"
				class="hover:text-foreground text-sm {filters.category === null
					? 'text-foreground underline underline-offset-4'
					: 'text-muted-foreground'}"
				onclick={() => setCategory(null)}
			>
				Todo
			</button>

			{#each facets.categories as category (category.id)}
				<button
					type="button"
					class="hover:text-foreground text-sm {filters.category === category.slug
						? 'text-foreground underline underline-offset-4'
						: 'text-muted-foreground'}"
					onclick={() => setCategory(category.slug)}
				>
					{category.name}
				</button>
			{/each}
		</div>
	</section>

	<!--
		Una sección por eje, y solo los que de verdad usan los productos
		publicados: en una librería no aparece "Variación" porque nadie la declara.
	-->
	{#each facets.options as option (option.name)}
		<Separator />

		<section class="space-y-3">
			<p class="eyebrow">{option.name}</p>

			{#if esColor(option)}
				<div class="space-y-2">
					{#each option.values as valor (valor.value)}
						{@const clave = `${option.name}:${valor.value}`}
						{@const selected = filters.options.includes(clave)}
						<div class="flex items-center gap-2">
							<Checkbox
								id="opcion-{clave}"
								checked={selected}
								onCheckedChange={(checked) => toggleMulti('opcion', clave, checked === true)}
							/>
							<Label for="opcion-{clave}" class="flex cursor-pointer items-center gap-2 text-sm">
								<span
									class="border-border size-3.5 rounded-full border"
									style="background-color: {valor.hex}"
								></span>
								{valor.value}
							</Label>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-wrap gap-2">
					{#each option.values as valor (valor.value)}
						{@const clave = `${option.name}:${valor.value}`}
						{@const selected = filters.options.includes(clave)}
						<button
							type="button"
							class="border-border min-w-11 border px-3 py-2 text-xs transition-colors {selected
								? 'bg-primary text-primary-foreground border-primary'
								: 'hover:bg-accent'}"
							aria-pressed={selected}
							onclick={() => toggleMulti('opcion', clave, !selected)}
						>
							{valor.value}
						</button>
					{/each}
				</div>
			{/if}
		</section>
	{/each}

	{#if priceSteps.length > 0}
		<Separator />

		<section class="space-y-3">
			<p class="eyebrow">Precio</p>

			<div class="flex flex-col items-start gap-2">
				{#each priceSteps as step (step)}
					<button
						type="button"
						class="hover:text-foreground text-sm {filters.maxPrice === step
							? 'text-foreground underline underline-offset-4'
							: 'text-muted-foreground'}"
						onclick={() => setPriceCap(filters.maxPrice === step ? null : step)}
					>
						Hasta {formatMoney(step)}
					</button>
				{/each}
			</div>
		</section>
	{/if}

	{#if hasFilters}
		<Button type="button" variant="outline" class="w-full" onclick={clearAll}>
			Limpiar filtros
		</Button>
	{/if}
</div>
