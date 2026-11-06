<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { DOMAIN_STATUS_LABEL } from '$lib/domain/domain';
	import * as Alert from '$lib/components/atoms/alert';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { CopyButton } from '$lib/components/atoms/copy-button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let host = $state('');
	let enviando = $state(false);
	let confirmando = $state(false);

	const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });

	const domain = $derived(data.domain);
</script>

<svelte:head>
	<title>Dominio — Globerce</title>
</svelte:head>

{#snippet quitarDominio(texto: string)}
	{#if confirmando}
		<form method="POST" action="?/quitar" use:enhance class="space-y-3">
			<p class="text-sm">{texto}</p>
			<div class="flex gap-2">
				<Button type="submit" variant="destructive" disabled={enviando}>Sí, quitar dominio</Button>
				<Button type="button" variant="ghost" onclick={() => (confirmando = false)}>Cancelar</Button
				>
			</div>
		</form>
	{:else}
		<Button type="button" variant="ghost" onclick={() => (confirmando = true)}>
			Quitar dominio
		</Button>
	{/if}
{/snippet}

<header class="mb-6">
	<h1 class="text-3xl">Dominio propio</h1>
	<p class="text-muted-foreground text-sm">
		Tu tienda en tu propio dominio, por ejemplo www.mitienda.com.
	</p>
</header>

<FormFeedback error={form?.error ?? null} message={form?.message ?? null} />

{#if !data.allowed}
	<section class="border-border bg-card mb-6 rounded-lg border p-6">
		<h2 class="mb-2 text-lg">Tu plan no incluye dominio propio</h2>
		<p class="text-muted-foreground mb-4 text-sm">
			Con un dominio propio tus clientas entran a tu tienda directamente, sin pasar por Globerce.
			Está disponible en los planes Pro e Impulso.
		</p>
		<Button href="/admin/plan" variant="outline">Ver planes</Button>
	</section>

	{#if domain?.status === 'disabled'}
		<section class="border-border bg-card rounded-lg border p-6">
			<h2 class="mb-2 text-lg">{domain.host}</h2>
			<p class="text-muted-foreground mb-4 text-sm">
				Tu tienda vuelve a verse en su subdominio hasta que cambies de plan.
			</p>
			{@render quitarDominio(
				'¿Quitar el dominio? Puedes conectarlo de nuevo si vuelves a un plan que lo incluya.'
			)}
		</section>
	{/if}
{:else if !domain}
	<section class="border-border bg-card rounded-lg border p-6">
		<h2 class="mb-2 text-lg">Conecta tu dominio</h2>
		<p class="text-muted-foreground mb-4 text-sm">
			Escribe el dominio que ya tienes. Te diremos qué registros poner para que apunte a tu tienda.
		</p>

		<form
			method="POST"
			action="?/guardar"
			class="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
			use:enhance={() => {
				enviando = true;
				return async ({ update }) => {
					await update();
					enviando = false;
				};
			}}
		>
			<div class="space-y-2">
				<Label for="host">Tu dominio</Label>
				<Input
					id="host"
					name="host"
					required
					autocomplete="off"
					placeholder="www.mitienda.com"
					bind:value={host}
				/>
				<p class="text-muted-foreground text-xs">
					Te recomendamos usar www. delante. El dominio lo compraste en tu proveedor; aquí solo lo
					conectas.
				</p>
			</div>

			<Button type="submit" disabled={enviando}>Conectar dominio</Button>
		</form>
	</section>
{:else}
	<section class="border-border bg-card mb-6 rounded-lg border p-6">
		<div class="mb-4 flex flex-wrap items-center gap-3">
			<h2 class="text-lg">{domain.host}</h2>
			<Badge
				variant={domain.status === 'failed' ? 'destructive' : 'outline'}
				class={domain.status === 'active' ? 'bg-success text-success-foreground' : ''}
			>
				{DOMAIN_STATUS_LABEL[domain.status]}
			</Badge>
		</div>

		{#if domain.status === 'active'}
			<p class="text-success mb-2 text-sm">Tu tienda ya se ve en tu dominio.</p>
			{#if domain.verified_at}
				<p class="text-muted-foreground mb-4 text-sm">
					Verificado el {dateFormatter.format(new Date(domain.verified_at))}.
				</p>
			{/if}
			<a
				href={`https://${domain.host}`}
				target="_blank"
				rel="noopener"
				class="mb-6 inline-block font-medium underline underline-offset-4"
			>
				Abrir https://{domain.host}
			</a>
		{:else if domain.status === 'disabled'}
			<p class="text-muted-foreground mb-4 text-sm">
				Tu plan ya no incluye dominio propio. Tu tienda vuelve a verse en su subdominio.
			</p>
		{:else}
			<p class="text-muted-foreground mb-4 text-sm">
				Entra a la página donde compraste tu dominio y crea estos registros. Pueden tardar hasta 24
				horas en aparecer. Si no se verifican en 7 días, el dominio se libera.
			</p>

			{#if domain.last_error}
				<Alert.Root variant="destructive" class="mb-4">
					<Alert.Description>{domain.last_error}</Alert.Description>
				</Alert.Root>
			{/if}

			<div class="border-border mb-4 overflow-hidden rounded-md border">
				<Table.Root class="table-stack">
					<Table.Header>
						<Table.Row>
							<Table.Head>Tipo</Table.Head>
							<Table.Head>Nombre</Table.Head>
							<Table.Head>Valor</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each domain.dns_records as record (`${record.type}-${record.name}`)}
							<Table.Row>
								<Table.Cell data-label="Tipo" class="font-medium">{record.type}</Table.Cell>
								<Table.Cell data-label="Nombre">
									<span class="flex items-center gap-1 font-mono text-sm">
										{record.name}
										<CopyButton value={record.name} label="el nombre del registro" />
									</span>
								</Table.Cell>
								<Table.Cell data-label="Valor">
									<span class="flex items-center gap-1 font-mono text-sm break-all">
										{record.value}
										<CopyButton value={record.value} label="el valor del registro" />
									</span>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>

			<form
				method="POST"
				action="?/verificar"
				class="mb-6"
				use:enhance={() => {
					enviando = true;
					return async ({ update }) => {
						await update();
						enviando = false;
					};
				}}
			>
				<Button type="submit" disabled={enviando}>Ya los puse, verificar</Button>
			</form>
		{/if}

		{#if domain.status !== 'disabled'}
			{@render quitarDominio(
				'¿Quitar el dominio? Tu tienda vuelve a su subdominio. Para conectar otro, primero quita este.'
			)}
		{/if}
	</section>
{/if}
