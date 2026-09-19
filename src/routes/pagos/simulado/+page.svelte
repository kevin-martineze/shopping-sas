<script lang="ts">
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	import { enhance } from '$app/forms';

	import type { PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import AuthCard from '$lib/components/molecules/AuthCard.svelte';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Pago de prueba — Globerce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<AuthCard eyebrow="Pago de prueba" title="Aquí iría la pasarela">
	<div class="border-sale text-sale mb-6 flex items-start gap-2 border p-3 text-sm">
		<TriangleAlert class="mt-0.5 size-4 flex-none" />
		<p>
			Esto no cobra nada. Es la pasarela de mentira que se usa mientras no hay una de verdad
			conectada.
		</p>
	</div>

	<dl class="border-border space-y-2 border p-4 text-sm">
		<div class="flex justify-between gap-4">
			<dt class="text-muted-foreground">Concepto</dt>
			<dd class="text-right">{data.concepto}</dd>
		</div>
		<div class="flex justify-between gap-4">
			<dt class="text-muted-foreground">Total</dt>
			<dd class="text-lg font-semibold tabular-nums">{formatMoney(data.monto)}</dd>
		</div>
		<div class="flex justify-between gap-4">
			<dt class="text-muted-foreground">Referencia</dt>
			<dd class="text-muted-foreground truncate text-right text-xs">{data.referencia}</dd>
		</div>
	</dl>

	<form
		method="POST"
		action="?/aprobar"
		class="mt-6 space-y-3"
		use:enhance={() => {
			submitting = true;

			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
	>
		<input type="hidden" name="referencia" value={data.referencia} />
		<input type="hidden" name="monto" value={data.monto} />
		<input type="hidden" name="volver" value={data.volver} />

		<Button type="submit" class="w-full" disabled={submitting}>
			<CreditCard class="mr-2 size-4" />
			{submitting ? 'Confirmando…' : 'Aprobar el pago'}
		</Button>

		<Button href={data.volver} variant="outline" class="w-full">Cancelar</Button>
	</form>
</AuthCard>
