<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import AuthCard from '$lib/components/molecules/AuthCard.svelte';
	import { PASSWORD_MIN, STORE_SLUG_PATTERN } from '$lib/schemas/account';
	import { slugify } from '$lib/utils/slug';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state(false);
	let storeName = $state('');
	/** Mientras la dueña no la toque, la dirección sigue al nombre. */
	let slugEdited = $state(false);
	let customSlug = $state('');

	const storeSlug = $derived(slugEdited ? customSlug : slugify(storeName).slice(0, 40));
</script>

<svelte:head>
	<title>Crea tu tienda — Globerce</title>
</svelte:head>

<AuthCard
	eyebrow={data.signedIn ? 'Otra tienda' : '14 días gratis'}
	title="Crea tu tienda en Globerce"
	wide
>
	<form
		method="POST"
		class="space-y-6"
		use:enhance={() => {
			submitting = true;

			return async ({ update }) => {
				await update({ reset: false });
				submitting = false;
			};
		}}
	>
		<fieldset class="space-y-4">
			<legend class="mb-2 text-sm font-medium">Tu tienda</legend>

			<div class="space-y-2">
				<Label for="storeName">Nombre</Label>
				<Input id="storeName" name="storeName" required maxlength={80} bind:value={storeName} />
			</div>

			<div class="space-y-2">
				<Label for="storeSlug">Dirección</Label>
				<div class="flex items-center gap-2">
					<Input
						id="storeSlug"
						name="storeSlug"
						required
						minlength={3}
						maxlength={40}
						pattern={STORE_SLUG_PATTERN.source.slice(1, -1)}
						value={storeSlug}
						oninput={(event) => {
							slugEdited = true;
							customSlug = event.currentTarget.value;
						}}
					/>
					{#if data.addressSuffix}
						<span class="text-muted-foreground text-sm whitespace-nowrap">{data.addressSuffix}</span
						>
					{/if}
				</div>
				<p class="text-muted-foreground text-xs">
					Minúsculas, números y guiones. No se puede cambiar después.
				</p>
			</div>

			<div class="space-y-2">
				<Label for="whatsappPhone">WhatsApp de ventas</Label>
				<Input
					id="whatsappPhone"
					name="whatsappPhone"
					type="tel"
					required
					placeholder="57 300 123 4567"
					autocomplete="tel"
				/>
				<p class="text-muted-foreground text-xs">
					Con indicativo del país. Aquí llegan los pedidos.
				</p>
			</div>
		</fieldset>

		{#if !data.signedIn}
			<fieldset class="space-y-4">
				<legend class="mb-2 text-sm font-medium">Tu cuenta</legend>

				<div class="space-y-2">
					<Label for="fullName">Tu nombre</Label>
					<Input id="fullName" name="fullName" required autocomplete="name" />
				</div>

				<div class="space-y-2">
					<Label for="email">Correo</Label>
					<Input id="email" name="email" type="email" required autocomplete="username" />
				</div>

				<div class="grid gap-4 sm:grid-cols-2">
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
					</div>

					<div class="space-y-2">
						<Label for="confirm">Repítela</Label>
						<Input
							id="confirm"
							name="confirm"
							type="password"
							required
							autocomplete="new-password"
						/>
					</div>
				</div>
				<p class="text-muted-foreground text-xs">Mínimo {PASSWORD_MIN} caracteres.</p>
			</fieldset>
		{/if}

		{#if form?.error}
			<p class="text-destructive text-sm">{form.error}</p>
		{/if}

		<Button type="submit" class="w-full" disabled={submitting}>
			{submitting ? 'Creando tu tienda…' : 'Crear tienda'}
		</Button>
	</form>

	{#snippet footer()}
		{#if data.signedIn}
			<a href="/admin" class="hover:text-foreground underline">Volver al panel</a>
		{:else}
			¿Ya tienes tienda?
			<a href="/admin/login" class="hover:text-foreground underline">Inicia sesión</a>
		{/if}
	{/snippet}
</AuthCard>
