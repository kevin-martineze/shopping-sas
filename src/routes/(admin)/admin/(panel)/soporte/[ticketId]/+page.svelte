<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';

	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Label } from '$lib/components/atoms/label';
	import { Textarea } from '$lib/components/atoms/textarea';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import {
		SUPPORT_CATEGORY_LABEL,
		SUPPORT_STATUS_LABEL,
		type SupportAuthor
	} from '$lib/domain/support';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state(false);

	const AUTHOR_LABEL: Record<SupportAuthor, string> = {
		OWNER: 'Tú',
		TEAM: 'Equipo Globerce'
	};

	const dateFormatter = new Intl.DateTimeFormat('es-CO', {
		dateStyle: 'medium',
		timeStyle: 'short'
	});

	const submit: SubmitFunction = () => {
		submitting = true;

		return async ({ update }) => {
			await update();
			submitting = false;
		};
	};
</script>

<svelte:head>
	<title>{data.thread.ticket.subject} — Soporte · Globerce</title>
</svelte:head>

<a
	href="/admin/soporte"
	class="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm"
>
	<ArrowLeft class="size-4" />
	Todos los casos
</a>

<header class="mb-6">
	<h1 class="text-2xl">{data.thread.ticket.subject}</h1>
	<div class="text-muted-foreground mt-2 flex flex-wrap items-center gap-2 text-sm">
		<span>{SUPPORT_CATEGORY_LABEL[data.thread.ticket.category]}</span>
		<Badge variant="outline">{SUPPORT_STATUS_LABEL[data.thread.ticket.status]}</Badge>
	</div>
</header>

<section class="mb-8 space-y-3">
	{#each data.thread.messages as message (message.id)}
		<article
			class={message.author === 'OWNER'
				? 'border-border bg-muted ml-auto max-w-xs rounded-lg border p-4 sm:max-w-lg'
				: 'border-border bg-card mr-auto max-w-xs rounded-lg border p-4 sm:max-w-lg'}
		>
			<p class="mb-2 flex items-center justify-between gap-4 text-xs">
				<span class="font-medium">{AUTHOR_LABEL[message.author]}</span>
				<time class="text-muted-foreground" datetime={message.created_at}>
					{dateFormatter.format(new Date(message.created_at))}
				</time>
			</p>
			<p class="text-sm whitespace-pre-line">{message.body}</p>
		</article>
	{/each}
</section>

{#if data.thread.ticket.status === 'CLOSED'}
	<p class="text-muted-foreground mb-4 text-sm">
		Este caso está cerrado. Si escribes, lo reabrimos.
	</p>
{/if}

<section class="border-border bg-card rounded-lg border p-6">
	<h2 class="mb-4 text-lg">Responder</h2>

	<FormFeedback error={form?.error ?? null} />

	<form method="POST" action="?/responder" class="space-y-4" use:enhance={submit}>
		<div class="space-y-2">
			<Label for="body">Tu mensaje</Label>
			<Textarea id="body" name="body" required rows={4} maxlength={5000} />
		</div>

		<Button type="submit" disabled={submitting}>
			{submitting ? 'Enviando…' : 'Enviar respuesta'}
		</Button>
	</form>
</section>
