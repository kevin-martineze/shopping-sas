<script lang="ts">
	import { untrack } from 'svelte';

	import type { ProductOption } from '$lib/server/api/panel-catalog';

	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import ColorField from '$lib/components/molecules/ColorField.svelte';
	import { RUBROS } from '$lib/domain/rubros';

	/**
	 * Los ejes por los que se divide un producto.
	 *
	 * Cada producto declara los suyos: una camisa se divide por variación y color,
	 * un café por molienda y peso, un libro por nada. Antes eran dos listas de
	 * la tienda —colores y variaciones— y eso obligaba a toda tienda a vender ropa.
	 *
	 * La lista viaja como JSON en un campo oculto y no como campos sueltos:
	 * son arreglos anidados de largo variable, y `FormData` los aplanaría a
	 * `values[0][hex]`, que hay que volver a armar del otro lado. Esta pantalla
	 * ya necesita JavaScript para añadir y quitar filas, así que no se pierde
	 * nada que no estuviera perdido.
	 */
	interface Props {
		options: ProductOption[];
		/** Sin ejes que ya estén en uso no se puede quitar nada: lo dirá el servidor. */
		submitting?: boolean;
	}

	let { options, submitting = false }: Props = $props();

	interface ValorEditable {
		value: string;
		hex: string;
	}

	interface EjeEditable {
		name: string;
		values: ValorEditable[];
	}

	/**
	 * Copia local: mutar el prop sería editar lo que el servidor dijo que hay.
	 *
	 * `untrack` porque es una semilla, no una suscripción: cuando el servidor
	 * responde, la página se recarga y el componente se monta de nuevo con los
	 * ejes ya guardados. Sin él, lo tecleado se perdería en cada respuesta.
	 */
	let ejes = $state<EjeEditable[]>(
		untrack(() =>
			options.map((opcion) => ({
				name: opcion.name,
				values: opcion.values.map((valor) => ({ value: valor.value, hex: valor.hex ?? '' }))
			}))
		)
	);

	const MAX_EJES = 3;

	/** Lo que viaja: sin valores vacíos y sin hex cuando no es un color. */
	const payload = $derived(
		JSON.stringify(
			ejes
				.filter((eje) => eje.name.trim().length > 0)
				.map((eje) => ({
					name: eje.name.trim(),
					values: eje.values
						.filter((valor) => valor.value.trim().length > 0)
						.map((valor) => ({
							value: valor.value.trim(),
							...(valor.hex ? { hex: valor.hex } : {})
						}))
				}))
				.filter((eje) => eje.values.length > 0)
		)
	);

	/** Cuántas combinaciones saldrían. Sirve para avisar antes de crear ciento veinte. */
	const combinaciones = $derived(
		ejes.reduce(
			(total, eje) =>
				total * Math.max(1, eje.values.filter((valor) => valor.value.trim().length > 0).length),
			1
		)
	);

	/**
	 * Arranca con los ejes típicos de un rubro.
	 *
	 * Solo se ofrece cuando no hay ninguno: un atajo que pisara lo ya escrito
	 * sería una trampa, no una ayuda.
	 */
	function usarRubro(id: string) {
		const rubro = RUBROS.find((candidato) => candidato.id === id);

		if (!rubro) return;

		ejes = rubro.options.map((opcion) => ({
			name: opcion.name,
			values: opcion.values.map((valor) => ({ value: valor.value, hex: valor.hex ?? '' }))
		}));
	}

	function agregarEje() {
		ejes = [...ejes, { name: '', values: [{ value: '', hex: '' }] }];
	}

	function quitarEje(indice: number) {
		ejes = ejes.filter((_, actual) => actual !== indice);
	}

	function agregarValor(indice: number) {
		ejes = ejes.map((eje, actual) =>
			actual === indice ? { ...eje, values: [...eje.values, { value: '', hex: '' }] } : eje
		);
	}

	function quitarValor(indiceEje: number, indiceValor: number) {
		ejes = ejes.map((eje, actual) =>
			actual === indiceEje
				? { ...eje, values: eje.values.filter((_, i) => i !== indiceValor) }
				: eje
		);
	}
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>Cómo se divide</Card.Title>
		<Card.Description>
			Variación, color, molienda, formato… lo que aplique a este producto. Si no se divide en nada
			—un libro, una vela— déjalo vacío: tendrá una sola existencia.
		</Card.Description>
	</Card.Header>

	<Card.Content>
		<form method="POST" action="?/ejes" class="space-y-6" use:enhance>
			<input type="hidden" name="options" value={payload} />

			{#if ejes.length === 0}
				<div class="space-y-2">
					<p class="text-muted-foreground text-xs">¿Qué vendes? Te dejo los ejes típicos.</p>

					<div class="flex flex-wrap gap-2">
						{#each RUBROS as rubro (rubro.id)}
							<Button
								type="button"
								variant="outline"
								size="sm"
								title={rubro.hint}
								onclick={() => usarRubro(rubro.id)}
							>
								{rubro.label}
							</Button>
						{/each}
					</div>
				</div>
			{/if}

			{#each ejes as eje, indiceEje (indiceEje)}
				<div class="border-border space-y-3 rounded-lg border p-4">
					<div class="flex items-end gap-3">
						<div class="flex-1 space-y-1.5">
							<Label class="text-xs" for="eje-{indiceEje}">Nombre del eje</Label>
							<Input id="eje-{indiceEje}" bind:value={eje.name} placeholder="Variación" />
						</div>

						<Button
							type="button"
							variant="ghost"
							size="icon"
							aria-label="Quitar este eje"
							onclick={() => quitarEje(indiceEje)}
						>
							<Trash2 class="size-4" />
						</Button>
					</div>

					<div class="space-y-2">
						<p class="text-muted-foreground text-xs">Valores</p>

						{#each eje.values as valor, indiceValor (indiceValor)}
							<div class="flex items-end gap-2">
								<Input bind:value={valor.value} placeholder="M" class="flex-1" />

								<!-- El tono es opcional: solo tiene sentido en un eje de color, y
								     la vitrina lo usa para pintar la muestra en la tarjeta. -->
								<ColorField
									id="eje-{indiceEje}-valor-{indiceValor}-hex"
									bind:value={valor.hex}
									optional
								/>

								<Button
									type="button"
									variant="ghost"
									size="icon"
									aria-label="Quitar este valor"
									onclick={() => quitarValor(indiceEje, indiceValor)}
								>
									<Trash2 class="size-4" />
								</Button>
							</div>
						{/each}

						<Button
							type="button"
							variant="outline"
							size="sm"
							onclick={() => agregarValor(indiceEje)}
						>
							<Plus class="size-4" />
							Añadir valor
						</Button>
					</div>
				</div>
			{/each}

			<div class="flex flex-wrap items-center gap-3">
				{#if ejes.length < MAX_EJES}
					<Button type="button" variant="outline" onclick={agregarEje}>
						<Plus class="size-4" />
						Añadir eje
					</Button>
				{/if}

				<Button type="submit" disabled={submitting}>
					{submitting ? 'Guardando…' : 'Guardar ejes'}
				</Button>

				{#if ejes.length > 0}
					<p class="text-muted-foreground text-xs">
						{combinaciones}
						{combinaciones === 1 ? 'combinación posible' : 'combinaciones posibles'}
					</p>
				{/if}
			</div>

			<p class="text-muted-foreground text-xs">
				Quitar un valor que ya tenga existencias no se puede: primero borra esas combinaciones.
			</p>
		</form>
	</Card.Content>
</Card.Root>
