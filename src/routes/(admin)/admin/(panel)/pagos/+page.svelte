<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import CreditCard from '@lucide/svelte/icons/credit-card';

	import { enhance } from '$app/forms';

	import type { PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import WompiKeysPaste from '$lib/components/molecules/WompiKeysPaste.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let submitting = $state(false);
	/** Abierto cuando la dueña quiere reemplazar las llaves de una cuenta ya conectada. */
	let cambiando = $state(false);
	let copiado = $state(false);

	const cuenta = $derived(data.account);
	const conectada = $derived(cuenta.connected);
	const conAviso = $derived(conectada && cuenta.last_event_at !== null);
	/** Con la cuenta conectada y avisando, la página es un resumen; si no, los tres pasos. */
	const resumen = $derived(conAviso && !cambiando);

	const fechaHora = new Intl.DateTimeFormat('es-CO', {
		dateStyle: 'medium',
		timeStyle: 'short',
		timeZone: 'America/Bogota'
	});

	function formatear(iso: string | null): string {
		return iso ? fechaHora.format(new Date(iso)) : 'Todavía no';
	}

	const modoLabel = $derived(
		cuenta.mode === 'test' ? 'Pruebas' : cuenta.mode === 'prod' ? 'Producción' : 'Sin reconocer'
	);

	async function copiar() {
		if (!cuenta.events_url) return;

		await navigator.clipboard.writeText(cuenta.events_url);
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

{#if !data.canManage}
	<p class="text-muted-foreground text-sm">
		Solo la persona dueña de la tienda puede conectar la cuenta de cobro.
	</p>
{:else}
	<section class="border-border bg-card rounded-lg space-y-8 border p-6">
		{#if resumen}
			<div class="space-y-5">
				<div class="flex items-center gap-2">
					<CreditCard class="size-5" />
					<h2 class="text-lg">Estás cobrando en línea</h2>
				</div>

				<dl class="grid gap-4 text-sm sm:grid-cols-2">
					<div>
						<dt class="text-muted-foreground">Comercio en Wompi</dt>
						<dd>{cuenta.merchant_name ?? '—'}</dd>
					</div>
					<div>
						<dt class="text-muted-foreground">Modo</dt>
						<dd>{modoLabel}</dd>
					</div>
					<div>
						<dt class="text-muted-foreground">Último pago avisado</dt>
						<dd>{formatear(cuenta.last_event_at)}</dd>
					</div>
					<div>
						<dt class="text-muted-foreground">Llave pública</dt>
						<dd class="font-mono text-xs">
							{cuenta.public_key ? `${cuenta.public_key.slice(0, 12)}…` : '—'}
						</dd>
					</div>
					<div>
						<dt class="text-muted-foreground">Conectada desde</dt>
						<dd>{formatear(cuenta.updated_at)}</dd>
					</div>
				</dl>

				<div>
					<Button type="button" variant="outline" onclick={() => (cambiando = true)}>
						Cambiar llaves
					</Button>
				</div>

				<details class="text-sm">
					<summary class="text-muted-foreground cursor-pointer">Ver la URL de eventos</summary>
					<div class="border-border mt-3 flex items-center gap-2 border p-2">
						<code class="text-muted-foreground flex-1 truncate text-xs">{cuenta.events_url}</code>
						<Button type="button" variant="outline" size="sm" onclick={copiar}>
							{copiado ? 'Copiado' : 'Copiar'}
						</Button>
					</div>
				</details>
			</div>
		{:else}
			<ol class="space-y-8">
				<!-- Paso 1: tener la cuenta en Wompi. -->
				<li class="flex gap-4">
					<span
						class="border-border grid size-8 flex-none place-items-center rounded-full border text-sm"
					>
						{#if conectada}<Check class="size-4" />{:else}1{/if}
					</span>
					<div class="min-w-0 flex-1 space-y-2">
						<h2 class="text-lg">Ten tu cuenta en Wompi</h2>
						<p class="text-muted-foreground text-sm">
							Abre tu cuenta de comercio con el NIT o la cédula de tu negocio. Wompi te entrega las
							llaves para cobrar.
						</p>
						<Button
							href="https://comercios.wompi.co"
							target="_blank"
							rel="noopener"
							variant="outline"
							size="sm"
						>
							Abrir Wompi
						</Button>
					</div>
				</li>

				<!-- Paso 2: pegar las llaves. Con la cuenta conectada se muestra como hecho. -->
				<li class="flex gap-4">
					<span
						class="border-border grid size-8 flex-none place-items-center rounded-full border text-sm"
					>
						{#if conectada}<Check class="size-4" />{:else}2{/if}
					</span>
					<div class="min-w-0 flex-1 space-y-3">
						<h2 class="text-lg">Copia tus llaves y pégalas aquí</h2>

						{#if conectada && !cambiando}
							<p class="text-muted-foreground text-sm">Tus llaves ya están conectadas.</p>
							<Button type="button" variant="outline" size="sm" onclick={() => (cambiando = true)}>
								Cambiar llaves
							</Button>
						{:else}
							<p class="text-muted-foreground text-sm">
								En Wompi, ve a <span class="text-foreground">Desarrollo › Desarrolladores</span> y copia
								las cuatro llaves de tu modo de pruebas o de producción.
							</p>

							<form
								method="POST"
								action="?/conectar"
								novalidate
								class="space-y-4"
								use:enhance={() => {
									submitting = true;

									return async ({ result, update }) => {
										await update();
										submitting = false;

										if (result.type === 'success') cambiando = false;
									};
								}}
							>
								<WompiKeysPaste
									{submitting}
									submitLabel={conectada ? 'Reemplazar llaves' : 'Conectar'}
								/>

								{#if cambiando}
									<Button type="button" variant="ghost" onclick={() => (cambiando = false)}>
										Cancelar
									</Button>
								{/if}
							</form>
						{/if}
					</div>
				</li>

				<!-- Paso 3: el aviso de cada pago. Se activa cuando la cuenta está conectada. -->
				<li class={cn('flex gap-4', !conectada && 'opacity-60')}>
					<span
						class="border-border grid size-8 flex-none place-items-center rounded-full border text-sm"
					>
						3
					</span>
					<div class="min-w-0 flex-1 space-y-3">
						<h2 class="text-lg">Pide a Wompi que te avise de cada pago</h2>

						{#if !conectada}
							<p class="text-muted-foreground text-sm">Se activa cuando conectes tu cuenta.</p>
						{:else}
							<p class="text-muted-foreground text-sm">
								En Wompi, ve a
								<span class="text-foreground">Desarrollo › Desarrolladores › Pagos a terceros</span>
								y pega esta dirección como URL de eventos.
							</p>

							<div class="border-border flex items-center gap-2 border p-2">
								<code class="text-muted-foreground flex-1 truncate text-xs">
									{cuenta.events_url}
								</code>
								<Button type="button" variant="outline" size="sm" onclick={copiar}>
									{copiado ? 'Copiado' : 'Copiar'}
								</Button>
							</div>

							{#if cuenta.last_event_at === null}
								<p class="text-caution text-sm">Esperando el primer aviso de Wompi.</p>
							{/if}

							<p class="text-muted-foreground text-xs">
								Sin ese aviso, un pedido pagado te aparecería como sin pagar: es lo que confirma el
								cobro.
							</p>
						{/if}
					</div>
				</li>
			</ol>
		{/if}

		{#if conectada}
			<form
				method="POST"
				action="?/desconectar"
				class="border-border border-t pt-6"
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
{/if}
