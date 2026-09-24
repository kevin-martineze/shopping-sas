<script lang="ts">
	import { onMount } from 'svelte';

	import CreditCard from '@lucide/svelte/icons/credit-card';

	import { enhance } from '$app/forms';

	import type { PaymentMethod } from '$lib/domain/account';
	import type { CardErrors, CardInput } from '$lib/domain/card';
	import type { BillingSetup } from '$lib/server/api/billing';
	import { Button } from '$lib/components/atoms/button';
	import CardFields from '$lib/components/molecules/CardFields.svelte';
	import { cardIsEmpty, tokenizeCard, validateCard } from '$lib/domain/card';

	/**
	 * La tarjeta con que se cobra el plan solo.
	 *
	 * Es lo que convierte la suscripción en una suscripción: sin ella hay que
	 * acordarse de pagar cada mes, y la que se olvida un mes no es que no
	 * quisiera pagar.
	 *
	 * La tarjeta se cambia por un token contra la pasarela ANTES de enviar, y
	 * sus campos se borran del envío: el número no llega a nuestro servidor.
	 * Por eso el formulario solo aparece con JavaScript.
	 */
	interface Props {
		method: PaymentMethod;
		billing: BillingSetup;
		/** Pagar es de la dueña. Al personal se le dice, no se le ofrece. */
		canPay: boolean;
		/** Hasta cuándo está pago o dura la prueba, ya escrito. */
		periodEnd: string;
		enPrueba: boolean;
	}

	let { method, billing, canPay, periodEnd, enPrueba }: Props = $props();

	let abierto = $state(false);
	let submitting = $state(false);
	let card = $state<CardInput>({ number: '', expiry: '', cvc: '', holder: '' });
	let cardErrors = $state<CardErrors>({});
	let cardError = $state<string | null>(null);

	// `onMount` y no `$effect`: no se reacciona a nada, se constata que hay
	// JavaScript corriendo, que es lo único que puede tokenizar la tarjeta.
	let hidratado = $state(false);

	onMount(() => {
		hidratado = true;
	});
</script>

<section class="border-border bg-card space-y-4 rounded-lg border p-6">
	<div class="flex items-center gap-2">
		<CreditCard class="size-5" />
		<h2 class="text-lg">{method.connected ? 'Tu tarjeta' : 'Cobro automático'}</h2>
	</div>

	{#if method.connected}
		<p class="text-sm">
			<span class="font-mono">{method.brand ?? 'Tarjeta'} ···· {method.last4 ?? '····'}</span>
		</p>
		<p class="text-muted-foreground text-sm">
			{#if enPrueba}
				No se te ha cobrado nada. El primer cobro es el {periodEnd}, cuando termina tu prueba.
			{:else}
				El próximo cobro es el {periodEnd}. No tienes que hacer nada.
			{/if}
		</p>
	{:else}
		<p class="text-muted-foreground text-sm">
			Guarda una tarjeta y tu plan se cobra solo cuando toca. Sin ella, tienes que entrar a pagar
			cada mes, y una tienda con el plan vencido deja de vender.
		</p>
	{/if}

	{#if canPay && billing.available && hidratado}
		{#if abierto}
			<form
				method="POST"
				action="?/tarjeta"
				class="border-border space-y-4 border-t pt-4"
				use:enhance={async ({ cancel, formData }) => {
					// El número no viaja: se borra del envío antes de nada.
					for (const campo of ['cardNumber', 'cardExpiry', 'cardCvc', 'cardHolder']) {
						formData.delete(campo);
					}

					const fallos = cardIsEmpty(card)
						? { number: 'Escribe los datos de tu tarjeta.' }
						: validateCard(card);

					cardErrors = fallos;

					if (Object.keys(fallos).length > 0) {
						cancel();

						return;
					}

					submitting = true;

					try {
						formData.set('cardToken', await tokenizeCard(billing, card));
						formData.set('acceptanceToken', billing.acceptance_token);
						cardError = null;
					} catch (error: unknown) {
						submitting = false;
						cardError =
							error instanceof Error
								? error.message
								: 'No pudimos validar tu tarjeta. Inténtalo otra vez.';
						cancel();

						return;
					}

					return async ({ update }) => {
						await update();
						submitting = false;
						card = { number: '', expiry: '', cvc: '', holder: '' };
						abierto = false;
					};
				}}
			>
				<CardFields bind:card errors={cardErrors} />

				{#if cardError}
					<p class="text-destructive text-sm">{cardError}</p>
				{/if}

				<div class="flex items-center gap-3">
					<Button type="submit" disabled={submitting}>
						{submitting ? 'Guardando…' : 'Guardar tarjeta'}
					</Button>
					<Button type="button" variant="ghost" onclick={() => (abierto = false)}>Cancelar</Button>
				</div>

				<p class="text-muted-foreground text-xs">
					Guardarla no cobra nada hoy.
					{#if billing.terms_url}
						Al guardarla aceptas los
						<a
							href={billing.terms_url}
							target="_blank"
							rel="noopener noreferrer"
							class="underline underline-offset-2">términos de la pasarela</a
						>.
					{/if}
				</p>
			</form>
		{:else}
			<div class="border-border flex flex-wrap items-center gap-3 border-t pt-4">
				<Button
					type="button"
					variant={method.connected ? 'outline' : 'default'}
					onclick={() => (abierto = true)}
				>
					{method.connected ? 'Cambiar tarjeta' : 'Guardar una tarjeta'}
				</Button>

				{#if method.connected}
					<form method="POST" action="?/quitarTarjeta" use:enhance>
						<Button type="submit" variant="ghost">Quitarla</Button>
					</form>
				{/if}
			</div>
		{/if}
	{:else if !canPay}
		<p class="text-muted-foreground border-border border-t pt-4 text-xs">
			Solo quien creó la tienda puede poner la tarjeta.
		</p>
	{/if}
</section>
