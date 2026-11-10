<script lang="ts">
	import type { SubmitFunction } from '@sveltejs/kit';

	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	import { enhance } from '$app/forms';

	import type { PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import { Textarea } from '$lib/components/atoms/textarea';
	import SelectField from '$lib/components/molecules/SelectField.svelte';
	import {
		SUPPORT_CATEGORIES,
		SUPPORT_CATEGORY_LABEL,
		SUPPORT_STATUS_LABEL
	} from '$lib/domain/support';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let category = $state('');
	let submitting = $state(false);

	const categoryOptions = SUPPORT_CATEGORIES.map((value) => ({
		value,
		label: SUPPORT_CATEGORY_LABEL[value]
	}));

	const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });

	const submit: SubmitFunction = () => {
		submitting = true;

		return async ({ update }) => {
			await update();
			submitting = false;
		};
	};
</script>

<svelte:head>
	<title>Soporte — Globerce</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Soporte</h1>
	<p class="text-muted-foreground text-sm">
		Escríbenos si algo no funciona o tienes una duda sobre tu tienda. Te avisamos por correo cuando
		respondamos.
	</p>
</header>

<section class="border-border bg-card mb-8 rounded-lg border p-6">
	<h2 class="mb-4 text-lg">Abrir un caso</h2>

	<form method="POST" action="?/crear" class="grid gap-4 sm:grid-cols-2" use:enhance={submit}>
		<div class="space-y-2">
			<Label for="subject">Asunto</Label>
			<Input
				id="subject"
				name="subject"
				required
				maxlength={160}
				placeholder="Ej: No me llega el correo de pago"
			/>
		</div>

		<div class="space-y-2">
			<Label for="category">Motivo</Label>
			<SelectField
				id="category"
				name="category"
				bind:value={category}
				placeholder="Elige un motivo"
				options={categoryOptions}
			/>
		</div>

		<div class="space-y-2 sm:col-span-2">
			<Label for="body">Cuéntanos qué pasó</Label>
			<Textarea id="body" name="body" required rows={5} maxlength={5000} />
		</div>

		<div class="sm:col-span-2">
			<Button type="submit" disabled={submitting}>
				{submitting ? 'Enviando…' : 'Enviar caso'}
			</Button>
		</div>
	</form>
</section>

<h2 class="mb-3 text-lg">Tus casos</h2>

{#if data.support.tickets.length === 0}
	<p
		class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
	>
		Todavía no has abierto ningún caso.
	</p>
{:else}
	<ul class="border-border bg-card divide-border divide-y overflow-hidden rounded-lg border">
		{#each data.support.tickets as ticket (ticket.id)}
			<li>
				<a
					href="/admin/soporte/{ticket.id}"
					class="hover:bg-muted/50 flex items-center gap-4 px-5 py-4 transition-colors"
				>
					<div class="min-w-0 flex-1">
						<p class="truncate font-medium">{ticket.subject}</p>
						<p class="text-muted-foreground text-sm">
							{SUPPORT_CATEGORY_LABEL[ticket.category]} · {dateFormatter.format(
								new Date(ticket.last_message_at)
							)}
						</p>
					</div>

					<div class="flex flex-none items-center gap-2">
						{#if ticket.unread_replies > 0}
							<Badge>Respuesta nueva</Badge>
						{/if}
						<Badge variant="outline">{SUPPORT_STATUS_LABEL[ticket.status]}</Badge>
						<ChevronRight class="text-muted-foreground size-4" />
					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}
