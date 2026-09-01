<script lang="ts">
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
		value = $bindable('#c9c2b6'),
		id,
		form,
		label = 'Tono',
		class: className
	}: Props = $props();

	let open = $state(false);

	/** Tonos frecuentes en ropa, para no pelear con el selector del sistema. */
	const SUGERIDOS = [
		'#FFFFFF',
		'#EFE7DA',
		'#D8C3A5',
		'#C9C2B6',
		'#B85C38',
		'#6B705C',
		'#2C3E50',
		'#141414'
	];

	const hex = $derived(value.toUpperCase());
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

	<Popover.Content class="w-60 space-y-3">
		<div class="grid grid-cols-8 gap-1.5">
			{#each SUGERIDOS as tono (tono)}
				<button
					type="button"
					class={cn(
						'border-border size-6 rounded-sm border transition-transform hover:scale-110',
						hex === tono && 'ring-ring ring-2 ring-offset-2'
					)}
					style="background-color: {tono}"
					onclick={() => (value = tono)}
					aria-label="Usar {tono}"
				></button>
			{/each}
		</div>

		<div class="space-y-1">
			<Label class="text-xs" for="{id}-hex">Otro tono</Label>
			<div class="flex items-center gap-2">
				<input
					id="{id}-picker"
					type="color"
					bind:value
					class="border-input size-9 cursor-pointer rounded-md border bg-transparent"
					aria-label="Elegir tono personalizado"
				/>
				<Input
					id="{id}-hex"
					bind:value
					class="font-mono uppercase"
					maxlength={7}
					aria-label="Código del tono"
				/>
			</div>
		</div>

		<Button type="button" size="sm" class="w-full" onclick={() => (open = false)}>Listo</Button>
	</Popover.Content>
</Popover.Root>

<!-- El valor viaja aquí: el selector vive en un popover, fuera del formulario. -->
<input type="hidden" {name} {form} {value} />
