<script lang="ts">
	import { Checkbox } from '$lib/components/atoms/checkbox';
	import { Label } from '$lib/components/atoms/label';

	interface Props {
		/** El campo viaja con este nombre y el valor "on", como un checkbox nativo. */
		name: string;
		label: string;
		id: string;
		checked?: boolean;
		value?: string;
		disabled?: boolean;
		/** Id del formulario al que pertenece, cuando el campo vive fuera de él. */
		form?: string;
	}

	let {
		name,
		label,
		id,
		checked = $bindable(false),
		value = 'on',
		disabled = false,
		form
	}: Props = $props();
</script>

<div class="flex items-center gap-2">
	<Checkbox {id} {disabled} bind:checked />

	<!--
		El campo que se envía es este, no el que genera bits-ui: su input oculto
		ignora el atributo `form`, así que una fila cuyo formulario vive fuera de
		la grilla se guardaría siempre como desmarcada.
	-->
	<input
		type="checkbox"
		{name}
		{value}
		{form}
		{disabled}
		bind:checked
		class="sr-only"
		tabindex={-1}
		aria-hidden="true"
	/>

	<Label for={id} class="cursor-pointer text-xs font-normal">{label}</Label>
</div>
