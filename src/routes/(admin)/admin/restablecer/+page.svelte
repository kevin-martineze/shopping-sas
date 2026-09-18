<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import AuthCard from '$lib/components/molecules/AuthCard.svelte';
	import { PASSWORD_MIN } from '$lib/schemas/account';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Nueva contraseña — Globerce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<AuthCard title="Nueva contraseña">
	{#if !data.token}
		<p class="text-center text-sm">
			Este enlace está incompleto. Ábrelo de nuevo desde el correo o
			<a href="/admin/recuperar" class="underline">pide uno nuevo</a>.
		</p>
	{:else}
		<form
			method="POST"
			class="space-y-4"
			use:enhance={() => {
				submitting = true;

				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<input type="hidden" name="token" value={data.token} />

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
				<p class="text-muted-foreground text-xs">
					Mínimo {PASSWORD_MIN} caracteres. Una frase es más fácil de recordar.
				</p>
			</div>

			<div class="space-y-2">
				<Label for="confirm">Repítela</Label>
				<Input id="confirm" name="confirm" type="password" required autocomplete="new-password" />
			</div>

			{#if form?.error}
				<p class="text-destructive text-sm">
					{form.error}
					<a href="/admin/recuperar" class="underline">Pedir otro enlace</a>
				</p>
			{/if}

			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Guardando…' : 'Guardar contraseña'}
			</Button>
		</form>
	{/if}

	{#snippet footer()}
		<a href="/admin/login" class="hover:text-foreground underline">Volver a iniciar sesión</a>
	{/snippet}
</AuthCard>
