<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import AuthCard from '$lib/components/molecules/AuthCard.svelte';

	interface Props {
		form: ActionData;
	}

	let { form }: Props = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Panel — Recuperar contraseña</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<AuthCard title="Recuperar contraseña">
	{#if form?.sent}
		<div class="space-y-4 text-center">
			<p class="text-sm">
				Si <strong>{form.email}</strong> tiene cuenta, te llegará un correo con un enlace para elegir
				una contraseña nueva. Sirve una sola vez, durante una hora.
			</p>
			<p class="text-muted-foreground text-xs">¿No llega? Revisa el correo no deseado.</p>
		</div>
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
			<p class="text-muted-foreground text-sm">
				Escribe el correo con el que entras al panel y te enviaremos un enlace.
			</p>

			<div class="space-y-2">
				<Label for="email">Correo</Label>
				<Input id="email" name="email" type="email" required autocomplete="username" />
			</div>

			{#if form?.error}
				<p class="text-destructive text-sm">{form.error}</p>
			{/if}

			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Enviando…' : 'Enviar enlace'}
			</Button>
		</form>
	{/if}

	{#snippet footer()}
		<a href="/admin/login" class="hover:text-foreground underline">Volver a iniciar sesión</a>
	{/snippet}
</AuthCard>
