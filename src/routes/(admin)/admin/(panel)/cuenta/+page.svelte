<script lang="ts">
	import ExternalLink from '@lucide/svelte/icons/external-link';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import { MEMBER_ROLE_LABEL } from '$lib/domain/account';
	import { PASSWORD_MIN } from '$lib/schemas/account';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state(false);
	let passwordForm = $state<HTMLFormElement>();
</script>

<svelte:head>
	<title>Mi cuenta — Globerce</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Mi cuenta</h1>
	<p class="text-muted-foreground text-sm">
		{data.user.full_name ?? data.user.email} · {data.user.email}
	</p>
</header>

<FormFeedback
	error={form?.error ?? null}
	message={form && 'message' in form ? (form.message ?? null) : null}
/>

<div class="grid gap-6 lg:grid-cols-2">
	<section class="border-border bg-background border p-6">
		<h2 class="mb-4 text-lg">Cambiar contraseña</h2>

		<form
			bind:this={passwordForm}
			method="POST"
			action="?/contrasena"
			class="space-y-4"
			use:enhance={() => {
				submitting = true;

				return async ({ result, update }) => {
					await update({ reset: false });
					if (result.type === 'success') passwordForm?.reset();
					submitting = false;
				};
			}}
		>
			<div class="space-y-2">
				<Label for="currentPassword">Contraseña actual</Label>
				<Input
					id="currentPassword"
					name="currentPassword"
					type="password"
					required
					autocomplete="current-password"
				/>
			</div>

			<div class="space-y-2">
				<Label for="password">Contraseña nueva</Label>
				<Input
					id="password"
					name="password"
					type="password"
					required
					minlength={PASSWORD_MIN}
					autocomplete="new-password"
				/>
				<p class="text-muted-foreground text-xs">Mínimo {PASSWORD_MIN} caracteres.</p>
			</div>

			<div class="space-y-2">
				<Label for="confirm">Repítela</Label>
				<Input id="confirm" name="confirm" type="password" required autocomplete="new-password" />
			</div>

			<Button type="submit" disabled={submitting}>
				{submitting ? 'Guardando…' : 'Cambiar contraseña'}
			</Button>
		</form>
	</section>

	<section class="border-border bg-background border p-6">
		<h2 class="mb-4 text-lg">Tus tiendas</h2>

		<ul class="divide-border divide-y">
			{#each data.stores as store (store.id)}
				<li class="flex items-center justify-between gap-4 py-3">
					<div class="min-w-0">
						<p class="flex items-center gap-2 truncate">
							{store.name}
							{#if store.id === data.activeStoreId}
								<Badge>Abierta</Badge>
							{/if}
						</p>
						<a
							href={store.url}
							class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
						>
							{MEMBER_ROLE_LABEL[store.role]} · ver tienda
							<ExternalLink class="size-3" />
						</a>
					</div>

					{#if store.id !== data.activeStoreId}
						<form method="POST" action="?/cambiarTienda" use:enhance>
							<input type="hidden" name="storeId" value={store.id} />
							<Button type="submit" variant="outline" size="sm">Administrar</Button>
						</form>
					{/if}
				</li>
			{/each}
		</ul>

		<p class="text-muted-foreground mt-4 text-xs">
			¿Otra tienda? <a href="/registro" class="underline">Crea una nueva</a>.
		</p>
	</section>
</div>
