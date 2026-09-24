<script lang="ts">
	import Lock from '@lucide/svelte/icons/lock';

	import type { CardErrors, CardInput } from '$lib/domain/card';
	import TextField from '$lib/components/molecules/TextField.svelte';
	import { cardBrand, formatCardNumber, formatExpiry } from '$lib/domain/card';

	/**
	 * Los cuatro campos de una tarjeta.
	 *
	 * Los `name` existen para que cada campo tenga su etiqueta y su error bien
	 * enlazados, pero lo que se escribe acá NO viaja en el formulario: quien lo
	 * usa borra estos campos del envío y manda solo el token que devolvió la
	 * pasarela. Por eso este bloque solo se pinta con JavaScript: sin él no hay
	 * con qué tokenizar, y un número de tarjeta yendo a nuestro servidor es
	 * justo lo que no puede pasar.
	 */
	interface Props {
		card: CardInput;
		errors?: CardErrors;
		disabled?: boolean;
	}

	let { card = $bindable(), errors = {}, disabled = false }: Props = $props();

	/** American Express lleva cuatro; el resto, tres. */
	const codeLength = $derived(cardBrand(card.number) === 'amex' ? 4 : 3);
</script>

<div class="space-y-4">
	<TextField
		name="cardNumber"
		label="Número de la tarjeta"
		bind:value={card.number}
		error={errors.number}
		autocomplete="cc-number"
		inputmode="numeric"
		placeholder="4242 4242 4242 4242"
		maxlength={23}
		oninput={(event) => (card.number = formatCardNumber(event.currentTarget.value))}
	/>

	<div class="grid gap-4 sm:grid-cols-2">
		<TextField
			name="cardExpiry"
			label="Vencimiento"
			bind:value={card.expiry}
			error={errors.expiry}
			autocomplete="cc-exp"
			inputmode="numeric"
			placeholder="09/29"
			maxlength={5}
			oninput={(event) => (card.expiry = formatExpiry(event.currentTarget.value))}
		/>

		<TextField
			name="cardCvc"
			label="Código de seguridad"
			bind:value={card.cvc}
			error={errors.cvc}
			hint={`Los ${codeLength} dígitos del respaldo.`}
			autocomplete="cc-csc"
			inputmode="numeric"
			maxlength={codeLength}
			oninput={(event) => (card.cvc = event.currentTarget.value.replace(/\D/g, ''))}
		/>
	</div>

	<TextField
		name="cardHolder"
		label="Nombre en la tarjeta"
		bind:value={card.holder}
		error={errors.holder}
		autocomplete="cc-name"
		placeholder="MARIA RESTREPO"
	/>

	<p class="text-muted-foreground flex items-start gap-2 text-xs">
		<Lock class="mt-0.5 size-3.5 flex-none" />
		Tu tarjeta va directo a la pasarela de pagos y no pasa por Globerce: lo único que guardamos es un
		permiso para cobrarte, y los cuatro últimos dígitos.
	</p>

	{#if disabled}
		<p class="text-muted-foreground text-xs">Guardando…</p>
	{/if}
</div>
