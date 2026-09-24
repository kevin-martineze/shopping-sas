<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import { cn } from '$lib/utils';

	/**
	 * Un campo de texto con su etiqueta, su ayuda y su error.
	 *
	 * El error manda sobre la ayuda —dos textos bajo el mismo campo compiten— y
	 * se anuncia con `aria-describedby` y `aria-invalid`, que es lo que hace que
	 * un lector de pantalla diga qué está mal y no solo que algo lo está.
	 */
	interface Props {
		name: string;
		label: string;
		value?: string;
		type?: 'text' | 'email' | 'tel';
		/** Texto de ayuda. El error lo reemplaza mientras exista. */
		hint?: string;
		error?: string | null;
		required?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		/** Qué teclado abre el celular. `numeric` para lo que solo son dígitos. */
		inputmode?: HTMLInputAttributes['inputmode'];
		placeholder?: string;
		minlength?: number;
		maxlength?: number;
		pattern?: string;
		/** Se pega a la derecha del campo, como `.globerce.store`. */
		suffix?: string;
		oninput?: HTMLInputAttributes['oninput'];
		onblur?: HTMLInputAttributes['onblur'];
	}

	let {
		name,
		label,
		value = $bindable(''),
		type = 'text',
		hint,
		error = null,
		required = false,
		autocomplete,
		inputmode,
		placeholder,
		minlength,
		maxlength,
		pattern,
		suffix,
		oninput,
		onblur
	}: Props = $props();

	const describedBy = $derived(error ? `${name}-error` : hint ? `${name}-hint` : undefined);
</script>

<div class="space-y-2">
	<Label for={name}>{label}</Label>

	<div class={cn(suffix && 'flex items-center gap-2')}>
		<Input
			id={name}
			{name}
			{type}
			{required}
			{autocomplete}
			{inputmode}
			{placeholder}
			{minlength}
			{maxlength}
			{pattern}
			{oninput}
			{onblur}
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
		/>
		{#if suffix}
			<span class="text-muted-foreground text-sm whitespace-nowrap">{suffix}</span>
		{/if}
	</div>

	{#if error}
		<p id="{name}-error" class="text-destructive text-xs">{error}</p>
	{:else if hint}
		<p id="{name}-hint" class="text-muted-foreground text-xs">{hint}</p>
	{/if}
</div>
