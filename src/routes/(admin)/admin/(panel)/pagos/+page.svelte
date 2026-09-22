<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import CreditCard from '@lucide/svelte/icons/credit-card';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import TextField from '$lib/components/molecules/TextField.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state(false);
	let copiado = $state(false);

	const errors = $derived(form && 'errors' in form ? (form.errors ?? {}) : {});
	const message = $derived(form && 'message' in form ? (form.message ?? null) : null);

	async function copiar() {
		await navigator.clipboard.writeText(data.account.events_url);
		copiado = true;
		setTimeout(() => (copiado = false), 2000);
	}
</script>

<svelte:head>
	<title>Pagos — Globerce</title>
</svelte:head>

<header class="mb-6 space-y-1">
	<h1 class="text-3xl">Cobrar en línea</h1>
	<p class="text-muted-foreground max-w-2xl text-sm">
		Conecta tu cuenta de Wompi y tus clientes podrán pagar con tarjeta, transferencia o billetera
		sin salir de tu tienda. La plata llega a tu cuenta: Globerce no la toca ni cobra comisión por
		venta.
	</p>
</header>

<FormFeedback error={form && 'error' in form ? (form.error ?? null) : null} {message} />

{#if !data.canManage}
	<p class="text-muted-foreground text-sm">
		Solo las dueñas de la tienda pueden conectar la cuenta de cobro.
	</p>
{:else}
	<div class="grid gap-6 lg:grid-cols-3">
		<section class="border-border bg-background space-y-4 border p-6 lg:col-span-2">
			<div class="flex items-center gap-2">
				<CreditCard class="size-5" />
				<h2 class="text-lg">
					{data.account.connected ? 'Tu cuenta está conectada' : 'Conecta tu cuenta'}
				</h2>
			</div>

			{#if data.account.connected}
				<p class="text-muted-foreground text-sm">
					Estás cobrando con la llave <span class="font-mono">{data.account.public_key}</span>. Si
					pegas llaves nuevas, reemplazan a estas.
				</p>
			{/if}

			<form
				method="POST"
				action="?/conectar"
				novalidate
				class="space-y-4"
				use:enhance={() => {
					submitting = true;

					return async ({ update }) => {
						await update({ reset: true });
						submitting = false;
					};
				}}
			>
				<TextField
					name="publicKey"
					label="Llave pública"
					error={errors.publicKey}
					hint="Empieza por pub_. Es la que viaja en cada enlace de pago."
					required
				/>

				<TextField
					name="privateKey"
					label="Llave privada"
					error={errors.privateKey}
					hint="Empieza por prv_. No vuelve a mostrarse."
					required
				/>

				<div class="grid gap-4 sm:grid-cols-2">
					<TextField
						name="integritySecret"
						label="Secreto de integridad"
						error={errors.integritySecret}
						required
					/>

					<TextField
						name="eventsSecret"
						label="Secreto de eventos"
						error={errors.eventsSecret}
						required
					/>
				</div>

				<Button type="submit" disabled={submitting}>
					{submitting ? 'Guardando…' : data.account.connected ? 'Reemplazar llaves' : 'Conectar'}
				</Button>
			</form>

			{#if data.account.connected}
				<form
					method="POST"
					action="?/desconectar"
					class="border-border border-t pt-4"
					use:enhance={() => {
						submitting = true;

						return async ({ update }) => {
							await update();
							submitting = false;
						};
					}}
				>
					<Button type="submit" variant="outline" disabled={submitting}>
						Dejar de cobrar en línea
					</Button>
					<p class="text-muted-foreground mt-2 text-xs">
						Tus pedidos seguirán llegando por WhatsApp, como siempre.
					</p>
				</form>
			{/if}
		</section>

		<section class="border-border bg-background space-y-4 border p-6">
			<h2 class="text-lg">Cómo se hace</h2>

			<ol class="text-muted-foreground space-y-3 text-sm">
				<li>
					<span class="text-foreground">1.</span> Abre tu cuenta en
					<a href="https://comercios.wompi.co" target="_blank" rel="noopener" class="underline">
						Wompi
					</a>
					con el NIT o la cédula de tu negocio.
				</li>
				<li>
					<span class="text-foreground">2.</span> En su panel, copia las cuatro llaves y pégalas aquí.
				</li>
				<li>
					<span class="text-foreground">3.</span> En «eventos» de su panel, pega esta dirección para que
					nos avisen de cada pago:
				</li>
			</ol>

			<div class="border-border flex items-center gap-2 border p-2">
				<code class="text-muted-foreground flex-1 truncate text-xs">
					{data.account.events_url}
				</code>
				<Button type="button" variant="ghost" size="icon" onclick={copiar} aria-label="Copiar">
					{#if copiado}
						<Check class="size-4" />
					{:else}
						<Copy class="size-4" />
					{/if}
				</Button>
			</div>

			<p class="text-muted-foreground text-xs">
				Sin ese aviso, un pedido pagado te aparecería como sin pagar: es lo que confirma el cobro.
			</p>
		</section>
	</div>
{/if}
