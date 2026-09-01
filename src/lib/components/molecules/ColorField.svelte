<script lang="ts">
	import Check from '@lucide/svelte/icons/check';

	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Popover from '$lib/components/atoms/popover';
	import { cn } from '$lib/utils';

	interface Props {
		name: string;
		value?: string;
		id?: string;
		/** Id del formulario al que pertenece, cuando el campo vive fuera de él. */
		form?: string;
		label?: string;
		class?: string;
	}

	let {
		name,
		value = $bindable('#C9C2B6'),
		id,
		form,
		label = 'Tono',
		class: className
	}: Props = $props();

	let open = $state(false);

	/**
	 * Neutros arriba porque son la base de casi cualquier prenda, y debajo la
	 * rejilla de color con cinco luminosidades por matiz.
	 */
	const NEUTROS = [
		'#FFFFFF',
		'#F5F5F4',
		'#E7E5E4',
		'#D6D3D1',
		'#A8A29E',
		'#78716C',
		'#57534E',
		'#292524',
		'#141414',
		'#000000'
	];

	const MATICES = [
		['#FEE2E2', '#FCA5A5', '#EF4444', '#B91C1C', '#7F1D1D'],
		['#FFEDD5', '#FDBA74', '#F97316', '#C2410C', '#7C2D12'],
		['#FEF3C7', '#FCD34D', '#F59E0B', '#B45309', '#78350F'],
		['#ECFCCB', '#BEF264', '#84CC16', '#4D7C0F', '#365314'],
		['#DCFCE7', '#86EFAC', '#22C55E', '#15803D', '#14532D'],
		['#CCFBF1', '#5EEAD4', '#14B8A6', '#0F766E', '#134E4A'],
		['#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8', '#1E3A8A'],
		['#E0E7FF', '#A5B4FC', '#6366F1', '#4338CA', '#312E81'],
		['#F3E8FF', '#D8B4FE', '#A855F7', '#7E22CE', '#581C87'],
		['#FCE7F3', '#F9A8D4', '#EC4899', '#BE185D', '#831843'],
		['#F5F0E6', '#E8DCC8', '#D8C3A5', '#A98E6B', '#6B5641']
	];

	const hex = $derived(value.toUpperCase());

	function elegir(tono: string) {
		value = tono;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		{id}
		class={cn(
			'border-input bg-background hover:bg-accent focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 items-center gap-2 rounded-md border px-2 shadow-xs transition-colors focus-visible:ring-3 focus-visible:outline-none',
			className
		)}
		aria-label="{label}: {hex}"
	>
		<span class="border-border size-5 rounded-sm border" style="background-color: {value}"></span>
		<span class="text-muted-foreground font-mono text-xs">{hex}</span>
	</Popover.Trigger>

	<Popover.Content class="w-auto space-y-3">
		<div class="space-y-1.5">
			<p class="text-muted-foreground text-xs">Neutros</p>
			<div class="flex gap-1">
				{#each NEUTROS as tono (tono)}
					<button
						type="button"
						class={cn(
							'border-border grid size-6 place-items-center rounded-sm border transition-transform hover:scale-110',
							hex === tono && 'ring-ring ring-2 ring-offset-1'
						)}
						style="background-color: {tono}"
						onclick={() => elegir(tono)}
						aria-label="Usar {tono}"
					>
						{#if hex === tono}
							<Check class="size-3" style="color: {tono === '#FFFFFF' ? '#000' : '#fff'}" />
						{/if}
					</button>
				{/each}
			</div>
		</div>

		<div class="space-y-1.5">
			<p class="text-muted-foreground text-xs">Color</p>
			<div class="flex gap-1">
				{#each MATICES as columna, indice (indice)}
					<div class="flex flex-col gap-1">
						{#each columna as tono (tono)}
							<button
								type="button"
								class={cn(
									'border-border grid size-6 place-items-center rounded-sm border transition-transform hover:scale-110',
									hex === tono && 'ring-ring ring-2 ring-offset-1'
								)}
								style="background-color: {tono}"
								onclick={() => elegir(tono)}
								aria-label="Usar {tono}"
							>
								{#if hex === tono}
									<Check class="size-3 text-white mix-blend-difference" />
								{/if}
							</button>
						{/each}
					</div>
				{/each}
			</div>
		</div>

		<div class="border-border space-y-1.5 border-t pt-3">
			<Label class="text-xs" for="{id}-hex">Tono exacto</Label>
			<div class="flex items-center gap-2">
				<input
					id="{id}-picker"
					type="color"
					bind:value
					class="border-input size-9 cursor-pointer rounded-md border bg-transparent"
					aria-label="Abrir el selector completo"
				/>
				<Input
					id="{id}-hex"
					bind:value
					class="w-28 font-mono uppercase"
					maxlength={7}
					aria-label="Código del tono"
				/>
				<Button type="button" size="sm" onclick={() => (open = false)}>Listo</Button>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>

<!-- El valor viaja aquí: el selector vive en un popover, fuera del formulario. -->
<input type="hidden" {name} {form} {value} />
