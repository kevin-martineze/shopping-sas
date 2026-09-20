<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import { COUNTRIES } from '$lib/domain/phone';
	import { cn } from '$lib/utils';

	/**
	 * Un teléfono con su indicativo de país.
	 *
	 * El indicativo es un `<select>` nativo y no el de shadcn a propósito: el
	 * de shadcn es un botón con una lista dibujada por JavaScript, y sin él no
	 * envía nada. Este formulario está escrito para funcionar sin JavaScript
	 * —el servidor valida y une los dos campos—, así que el control tiene que
	 * ser uno que el navegador sepa enviar solo. Lleva los mismos tokens que
	 * el átomo `Input` para que no se note la diferencia.
	 *
	 * Van como DOS campos, no como uno: pegar el indicativo al número en el
	 * cliente obligaría a un input oculto que sin JavaScript nunca se
	 * actualizaría.
	 */
	interface Props {
		/** Nombre del número. El país viaja como `<name>Country`. */
		name: string;
		label: string;
		/** Número local, sin indicativo. */
		value?: string;
		/** Código ISO del país elegido. */
		country?: string;
		hint?: string;
		error?: string | null;
		required?: boolean;
		placeholder?: string;
		oninput?: HTMLInputAttributes['oninput'];
		onblur?: HTMLInputAttributes['onblur'];
	}

	let {
		name,
		label,
		value = $bindable(''),
		country = $bindable(''),
		hint,
		error = null,
		required = false,
		placeholder,
		oninput,
		onblur
	}: Props = $props();

	const describedBy = $derived(error ? `${name}-error` : hint ? `${name}-hint` : undefined);
</script>

<div class="space-y-2">
	<Label for={name}>{label}</Label>

	<div class="flex items-center gap-2">
		<select
			name="{name}Country"
			aria-label="Indicativo del país"
			bind:value={country}
			class={cn(
				'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 shrink-0 rounded-lg border bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:ring-3 md:text-sm dark:bg-input/30'
			)}
		>
			{#each COUNTRIES as pais (pais.code)}
				<option value={pais.code}>{pais.code} +{pais.dial}</option>
			{/each}
		</select>

		<Input
			id={name}
			{name}
			type="tel"
			{required}
			{placeholder}
			{oninput}
			{onblur}
			autocomplete="tel-national"
			inputmode="numeric"
			bind:value
			aria-invalid={error ? 'true' : undefined}
			aria-describedby={describedBy}
		/>
	</div>

	{#if error}
		<p id="{name}-error" class="text-destructive text-xs">{error}</p>
	{:else if hint}
		<p id="{name}-hint" class="text-muted-foreground text-xs">{hint}</p>
	{/if}
</div>
