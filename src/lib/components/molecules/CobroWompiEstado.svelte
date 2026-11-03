<script lang="ts">
	import type { CobroWompi } from '$lib/utils/wompi-checkout.svelte';

	interface Props {
		cobro: CobroWompi;
	}

	let { cobro }: Props = $props();
</script>

{#if cobro.confirmando}
	<p class="text-muted-foreground text-center text-sm">Estamos confirmando tu pago…</p>
{:else if cobro.expirado}
	<p class="text-muted-foreground text-center text-sm">
		Tu pago está en proceso. Recarga esta página en unos minutos para ver si ya quedó confirmado.
	</p>
{:else if cobro.rechazado}
	<p class="text-destructive text-center text-sm">
		Tu pago no se aprobó. Puedes intentarlo de nuevo.
	</p>
{/if}
