<script lang="ts">
	import * as Select from '$lib/components/atoms/select';
	import { cn } from '$lib/utils';

	export interface SelectOption {
		value: string;
		label: string;
	}

	interface Props {
		/** Nombre del campo: bits-ui genera el input oculto para la form action. */
		name: string;
		options: SelectOption[];
		value?: string;
		id?: string;
		placeholder?: string;
		disabled?: boolean;
		class?: string;
		'aria-label'?: string;
		onValueChange?: (value: string) => void;
	}

	let {
		name,
		options,
		value = $bindable(''),
		id,
		placeholder = 'Elige una opción',
		disabled = false,
		class: className,
		'aria-label': ariaLabel,
		onValueChange
	}: Props = $props();

	const selectedLabel = $derived(options.find((option) => option.value === value)?.label ?? '');
</script>

<!--
	`contents`: el Select de bits-ui deja un <input type="hidden"> después del
	botón para que el valor viaje en el form. Sin este envoltorio ese input es
	hermano del botón, y un `space-y-*` de afuera le pone margen abajo al botón
	(en Tailwind 4 se lo pone a todo hijo que no sea el último): el selector
	quedaba 8 px más arriba que los campos de al lado.
-->
<div class="contents">
	<Select.Root type="single" {name} bind:value {disabled} {onValueChange}>
		<Select.Trigger {id} class={cn('w-full', className)} aria-label={ariaLabel}>
			{selectedLabel || placeholder}
		</Select.Trigger>

		<Select.Content>
			{#each options as option (option.value)}
				<Select.Item value={option.value} label={option.label}>
					{option.label}
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
</div>
