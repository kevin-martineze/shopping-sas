<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import * as Card from '$lib/components/atoms/card';
	import * as Table from '$lib/components/atoms/table';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	const pending = $derived(data.requests.filter((request) => request.notified_at === null));
	const done = $derived(data.requests.filter((request) => request.notified_at !== null));

	const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });
</script>

<svelte:head>
	<title>Avisos de reposición — Panel</title>
</svelte:head>

<header class="mb-6 space-y-1">
	<h1 class="text-3xl">Avisos de reposición</h1>
	<p class="text-muted-foreground text-sm">
		Clientas que pidieron aviso cuando su talla vuelva. Son ventas casi hechas.
	</p>
</header>

<FormFeedback error={form?.error ?? null} />

<div class="space-y-8">
	<Card.Root>
		<Card.Header>
			<Card.Title>Pendientes</Card.Title>
			<Card.Description>
				{pending.length === 0 ? 'Nadie esperando por ahora.' : `${pending.length} esperando`}
			</Card.Description>
		</Card.Header>

		<Card.Content>
			{#if pending.length === 0}
				<p class="text-muted-foreground py-8 text-center text-sm">No hay avisos pendientes.</p>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Prenda</Table.Head>
							<Table.Head class="w-48">Contacto</Table.Head>
							<Table.Head class="w-32">Pedido el</Table.Head>
							<Table.Head class="w-32">Estado</Table.Head>
							<Table.Head class="w-48"></Table.Head>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{#each pending as request (request.id)}
							<Table.Row>
								<Table.Cell>
									<span class="block text-sm font-medium">
										{request.variants?.products?.name ?? 'Prenda eliminada'}
									</span>
									<span class="text-muted-foreground text-xs">
										{request.variants?.colors?.name ?? ''} / {request.variants?.sizes?.label ?? ''}
									</span>
								</Table.Cell>

								<Table.Cell class="text-sm">{request.contact}</Table.Cell>

								<Table.Cell class="text-muted-foreground text-xs">
									{dateFormatter.format(new Date(request.created_at))}
								</Table.Cell>

								<Table.Cell>
									{#if request.backInStock}
										<Badge>Ya hay stock</Badge>
									{:else}
										<Badge variant="outline">Sin stock</Badge>
									{/if}
								</Table.Cell>

								<Table.Cell>
									<div class="flex items-center gap-1">
										<Button
											href={request.chatUrl}
											target="_blank"
											rel="noopener noreferrer"
											size="sm"
											variant="outline"
											disabled={!request.backInStock}
										>
											<MessageCircle class="mr-1 size-3" />
											Avisar
										</Button>

										<Button type="submit" form="aviso-{request.id}" size="sm" variant="ghost">
											<Check class="mr-1 size-3" />
											Listo
										</Button>
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if done.length > 0}
		<Card.Root>
			<Card.Header>
				<Card.Title>Ya avisados</Card.Title>
				<Card.Description>{done.length} resueltos</Card.Description>
			</Card.Header>

			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Prenda</Table.Head>
							<Table.Head class="w-32">Talla</Table.Head>
							<Table.Head class="w-48">Contacto</Table.Head>
							<Table.Head class="w-32">Pedido el</Table.Head>
						</Table.Row>
					</Table.Header>

					<Table.Body>
						{#each done as request (request.id)}
							<Table.Row>
								<Table.Cell class="text-sm">
									{request.variants?.products?.name ?? 'Prenda eliminada'}
								</Table.Cell>
								<Table.Cell class="text-muted-foreground text-sm">
									{request.variants?.sizes?.label ?? ''}
								</Table.Cell>
								<Table.Cell class="text-muted-foreground text-sm">{request.contact}</Table.Cell>
								<Table.Cell class="text-muted-foreground text-xs">
									{dateFormatter.format(new Date(request.created_at))}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	{/if}
</div>

<!-- El HTML no admite <form> dentro de <tbody>: viven aquí y se referencian por id. -->
<div hidden>
	{#each pending as request (request.id)}
		<form id="aviso-{request.id}" method="POST" action="?/notificado" use:enhance>
			<input type="hidden" name="id" value={request.id} />
		</form>
	{/each}
</div>
