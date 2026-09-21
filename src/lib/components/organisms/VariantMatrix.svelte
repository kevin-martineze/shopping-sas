<script lang="ts">
	import type { AdminVariantRow, ProductOption } from '$lib/server/api/panel-catalog';

	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import CheckboxField from '$lib/components/molecules/CheckboxField.svelte';
	import NumberField from '$lib/components/molecules/NumberField.svelte';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		/** Los ejes declarados por el producto. Vacío: una sola existencia. */
		options: ProductOption[];
		variants: AdminVariantRow[];
		basePrice: number;
	}

	let { options, variants, basePrice }: Props = $props();

	let defaultStock = $state(0);

	interface Grupo {
		/** El valor del primer eje, o vacío cuando el producto no tiene ejes. */
		clave: string;
		titulo: string;
		hex: string | null;
		filas: AdminVariantRow[];
	}

	/**
	 * Agrupa por el PRIMER eje, sea cual sea.
	 *
	 * Antes se agrupaba por color porque no había otra cosa. Ahora el primer eje
	 * lo elige quien vende: la tienda de ropa verá un bloque por color, la
	 * tostadora uno por molienda, y el libro un único bloque sin título.
	 */
	const grupos = $derived.by(() => {
		const salida: Grupo[] = [];

		for (const variante of variants) {
			const primero = variante.values.at(0);
			const clave = primero?.id ?? '';
			const existente = salida.find((grupo) => grupo.clave === clave);

			if (existente) existente.filas.push(variante);
			else
				salida.push({
					clave,
					titulo: primero?.value ?? '',
					hex: primero?.hex ?? null,
					filas: [variante]
				});
		}

		return salida;
	});

	/** Cómo se llama la fila dentro de su grupo: los ejes que quedan. */
	function resto(variante: AdminVariantRow): string {
		return variante.values
			.slice(1)
			.map((valor) => valor.value)
			.join(' · ');
	}

	/** Cuántas combinaciones darían los ejes actuales. */
	const posibles = $derived(
		options.reduce((total, eje) => total * Math.max(1, eje.values.length), 1)
	);

	const faltan = $derived(Math.max(0, posibles - variants.length));
</script>

<div class="space-y-6">
	<Card.Root>
		<Card.Header>
			<Card.Title>Crear combinaciones</Card.Title>
			<Card.Description>
				{#if options.length === 0}
					Este producto no se divide en nada, así que tiene una sola existencia.
				{:else if faltan > 0}
					Faltan {faltan} de las {posibles} que dan tus ejes. Se crean las que falten, sin tocar las que
					ya existen.
				{:else}
					Ya existen las {posibles} combinaciones de tus ejes. Si añades un valor arriba, vuelve aquí
					para crear las nuevas.
				{/if}
			</Card.Description>
		</Card.Header>

		<Card.Content>
			<form method="POST" action="?/variantes" class="flex flex-wrap items-end gap-3" use:enhance>
				<div class="space-y-1.5">
					<Label class="text-xs" for="defaultStock">Existencias iniciales</Label>
					<NumberField
						id="defaultStock"
						name="defaultStock"
						bind:value={defaultStock}
						class="w-36"
					/>
				</div>

				<Button type="submit" disabled={faltan === 0 && variants.length > 0}>
					{faltan > 0 ? `Crear ${faltan}` : 'Crear'}
					{faltan === 1 ? 'combinación' : 'combinaciones'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	{#if grupos.length === 0}
		<Card.Root>
			<Card.Content class="text-muted-foreground py-12 text-center text-sm">
				Este producto todavía no tiene existencias. Créalas arriba para poder venderlo.
			</Card.Content>
		</Card.Root>
	{:else}
		{#each grupos as grupo (grupo.clave)}
			<Card.Root>
				{#if grupo.titulo}
					<Card.Header>
						<div class="flex items-center gap-2">
							{#if grupo.hex}
								<span
									class="border-border size-4 rounded-full border"
									style="background-color: {grupo.hex}"
								></span>
							{/if}
							<Card.Title class="text-base">{grupo.titulo}</Card.Title>
						</div>
					</Card.Header>
				{/if}

				<Card.Content>
					<Table.Root class="table-stack">
						<Table.Header>
							<Table.Row>
								<Table.Head class="w-32">Combinación</Table.Head>
								<Table.Head class="w-44">Existencias</Table.Head>
								<Table.Head class="w-48">Precio propio</Table.Head>
								<Table.Head>Se vende a</Table.Head>
								<Table.Head class="w-28">Activa</Table.Head>
								<Table.Head class="w-36"></Table.Head>
							</Table.Row>
						</Table.Header>

						<Table.Body>
							{#each grupo.filas as variant (`${variant.id}:${variant.active}`)}
								<Table.Row>
									<Table.Cell data-label="Combinación" class="text-sm font-medium">
										{resto(variant) || variant.label || 'Única'}
									</Table.Cell>

									<Table.Cell data-label="Existencias">
										<NumberField
											form="variante-{variant.id}"
											name="stock"
											value={variant.stock}
											invalid={variant.stock === 0}
											aria-label="Stock"
										/>
									</Table.Cell>

									<Table.Cell data-label="Precio propio">
										<NumberField
											form="variante-{variant.id}"
											name="priceOverride"
											value={variant.price_override ?? basePrice}
											step={1000}
											max={100000000}
											aria-label="Precio propio"
										/>
									</Table.Cell>

									<Table.Cell
										data-label="Se vende a"
										class="text-muted-foreground text-sm tabular-nums"
									>
										{formatMoney(variant.price_override ?? basePrice)}
									</Table.Cell>

									<Table.Cell data-label="Activa">
										<CheckboxField
											id="variante-activa-{variant.id}"
											form="variante-{variant.id}"
											name="active"
											label="Activa"
											checked={variant.active}
										/>
									</Table.Cell>

									<Table.Cell data-label="">
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
													aria-label="Borrar la combinación {variant.label || variant.sku || ''}"
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
