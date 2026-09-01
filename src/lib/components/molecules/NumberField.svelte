<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';

	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { cn } from '$lib/utils';

	interface Props {
		name: string;
		value?: number;
		id?: string;
		min?: number;
		max?: number;
		step?: number;
		/** Id del formulario al que pertenece, cuando el campo vive fuera de él. */
		form?: string;
		class?: string;
		invalid?: boolean;
		'aria-label'?: string;
	}

	let {
		name,
		value = $bindable(0),
		id,
		min = 0,
		max = 9999,
		step = 1,
		form,
		class: className,
		invalid = false,
		'aria-label': ariaLabel
	}: Props = $props();

	function bump(delta: number) {
		const next = Math.min(max, Math.max(min, (Number(value) || 0) + delta));
		value = next;
	}
</script>

<div
	class={cn(
		'border-input bg-background focus-within:border-ring focus-within:ring-ring/50 flex h-9 items-center rounded-md border shadow-xs transition-colors focus-within:ring-3',
		invalid && 'border-destructive',
		className
	)}
>
	<Button
		type="button"
		variant="ghost"
		size="icon"
		class="size-8 rounded-l-md rounded-r-none"
		onclick={() => bump(-step)}
		disabled={Number(value) <= min}
		aria-label="Restar"
	>
		<Minus class="size-3" />
	</Button>

	<Input
		{id}
		{name}
		{form}
		{min}
		{max}
		{step}
		type="number"
		bind:value
		aria-label={ariaLabel}
		class="h-8 border-0 bg-transparent px-0 text-center tabular-nums shadow-none focus-visible:ring-0"
	/>

	<Button
		type="button"
		variant="ghost"
		size="icon"
		class="size-8 rounded-l-none rounded-r-md"
		onclick={() => bump(step)}
		disabled={Number(value) >= max}
		aria-label="Sumar"
	>
		<Plus class="size-3" />
	</Button>
</div>
