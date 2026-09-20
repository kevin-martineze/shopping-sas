<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import AuthCard from '$lib/components/molecules/AuthCard.svelte';
	import { MEMBER_ROLE_LABEL } from '$lib/domain/account';
	import { PASSWORD_MIN } from '$lib/schemas/account';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Invitación — Globerce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<AuthCard title={data.invitation ? `Únete a ${data.invitation.store_name}` : 'Invitación'}>
	{#if !data.invitation}
		<p class="text-center text-sm">
			{data.problem} Pídele a la dueña de la tienda que te invite de nuevo.
		</p>
	{:else}
		{@const invitation = data.invitation}
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
				Te invitaron como <strong>{MEMBER_ROLE_LABEL[invitation.role].toLowerCase()}</strong> con el
				correo <strong>{invitation.email}</strong>.
				{invitation.account_exists
					? 'Ya tienes cuenta: confirma con tu contraseña.'
					: 'Crea tu cuenta para entrar al panel.'}
			</p>

			<input type="hidden" name="token" value={data.token} />
			<input type="hidden" name="existing" value={String(invitation.account_exists)} />

			{#if invitation.account_exists}
				<div class="space-y-2">
					<Label for="password">Tu contraseña</Label>
					<Input
						id="password"
						name="password"
						type="password"
						required
						autocomplete="current-password"
					/>
				</div>
			{:else}
				<div class="space-y-2">
					<Label for="fullName">Tu nombre</Label>
					<Input id="fullName" name="fullName" required autocomplete="name" />
				</div>

				<div class="space-y-2">
					<Label for="password">Contraseña</Label>
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
			{/if}

			{#if form?.error}
				<p class="text-destructive text-sm">{form.error}</p>
			{/if}

			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Entrando…' : 'Aceptar y entrar'}
			</Button>
		</form>
	{/if}

	{#snippet footer()}
		<a href="/admin/login" class="hover:text-foreground underline">Ir a iniciar sesión</a>
	{/snippet}
</AuthCard>
