<script lang="ts">
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';

	import type { HTMLInputAttributes } from 'svelte/elements';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';

	/**
	 * Una contraseña que se puede mirar.
	 *
	 * Sin el ojo, quien escribe una contraseña larga en el celular no tiene cómo
	 * saber qué tecleó y termina poniendo una corta. El botón es `type="button"`
	 * a propósito: dentro de un form, un botón sin tipo lo envía.
	 */
	interface Props {
		name: string;
		label: string;
		value?: string;
		hint?: string;
		error?: string | null;
		required?: boolean;
		autocomplete?: HTMLInputAttributes['autocomplete'];
		minlength?: number;
		oninput?: HTMLInputAttributes['oninput'];
		onblur?: HTMLInputAttributes['onblur'];
	}

	let {
		name,
		label,
		value = $bindable(''),
		hint,
		error = null,
		required = false,
		autocomplete = 'new-password',
		minlength,
		oninput,
		onblur
	}: Props = $props();

	let visible = $state(false);

	const describedBy = $derived(error ? `${name}-error` : hint ? `${name}-hint` : undefined);
</script>

<div class="space-y-2">
	<Label for={name}>{label}</Label>

	<div class="relative">
		<Input
			id={name}
			{name}
			type={visible ? 'text' : 'password'}
			{required}
			{autocomplete}
			{minlength}
			{oninput}
			{onblur}
			bind:value
			class="pr-9"
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
		/>

		<button
			type="button"
			class="text-muted-foreground hover:text-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 grid w-9 place-items-center rounded-r-lg outline-none focus-visible:ring-3"
			onclick={() => (visible = !visible)}
			aria-label={visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña'}
			aria-pressed={visible}
		>
			{#if visible}
				<EyeOff class="size-4" />
			{:else}
				<Eye class="size-4" />
			{/if}
		</button>
	</div>

	{#if error}
		<p id="{name}-error" class="text-destructive text-xs">{error}</p>
	{:else if hint}
		<p id="{name}-hint" class="text-muted-foreground text-xs">{hint}</p>
	{/if}
</div>
