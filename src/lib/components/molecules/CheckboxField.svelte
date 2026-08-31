<script lang="ts">
	import { Checkbox } from '$lib/components/atoms/checkbox';
	import { Label } from '$lib/components/atoms/label';

	interface Props {
		/** El input oculto viaja con este nombre y el valor "on", como un checkbox nativo. */
		name: string;
		label: string;
		id: string;
		checked?: boolean;
		value?: string;
		disabled?: boolean;
	}

	let {
		name,
		label,
		id,
		checked = $bindable(false),
		value = 'on',
		disabled = false
	}: Props = $props();
</script>

<div class="flex items-center gap-2">
	<Checkbox {id} {name} {value} {disabled} bind:checked />
	<Label for={id} class="cursor-pointer text-xs font-normal">{label}</Label>
</div>
