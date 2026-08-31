<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
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

<header class="mb-6">
	<h1 class="text-3xl">Avisos de reposición</h1>
	<p class="text-muted-foreground text-sm">
		Clientas que pidieron aviso cuando su talla vuelva. Son ventas casi hechas.
	</p>
</header>

<FormFeedback error={form?.error ?? null} />

{#if pending.length === 0}
	<p
		class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
	>
		No hay avisos pendientes.
	</p>
{:else}
	<ul class="border-border bg-background divide-border divide-y border">
		{#each pending as request (request.id)}
			<li class="flex flex-wrap items-center gap-3 p-4">
				<div class="min-w-0 flex-1">
					<p class="text-sm font-medium">
						{request.variants?.products?.name ?? 'Prenda eliminada'}
						<span class="text-muted-foreground text-xs">
							· {request.variants?.colors?.name ?? ''} / {request.variants?.sizes?.label ?? ''}
						</span>
					</p>
					<p class="text-muted-foreground text-xs">
						{request.contact} · {dateFormatter.format(new Date(request.created_at))}
					</p>
				</div>

				{#if request.backInStock}
					<Badge>Ya hay stock</Badge>
				{:else}
					<Badge variant="outline">Sin stock</Badge>
				{/if}

				<div class="flex gap-2">
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

					<form method="POST" action="?/notificado" use:enhance>
						<input type="hidden" name="id" value={request.id} />
						<Button type="submit" size="sm" variant="ghost">
							<Check class="mr-1 size-3" />
							Listo
						</Button>
					</form>
				</div>
			</li>
		{/each}
	</ul>
{/if}

{#if done.length > 0}
	<section class="mt-10">
		<h2 class="text-muted-foreground mb-3 text-sm">Ya avisados ({done.length})</h2>

		<ul class="border-border divide-border divide-y border">
			{#each done as request (request.id)}
				<li class="text-muted-foreground flex justify-between gap-3 p-3 text-xs">
					<span>
						{request.variants?.products?.name ?? 'Prenda eliminada'} ·
						{request.variants?.sizes?.label ?? ''} · {request.contact}
					</span>
					<span>{dateFormatter.format(new Date(request.created_at))}</span>
				</li>
			{/each}
		</ul>
	</section>
{/if}
