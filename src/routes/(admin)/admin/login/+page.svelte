<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state(false);
</script>

<svelte:head>
	<title>Panel — Iniciar sesión</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="admin-shell grid min-h-screen place-items-center px-4">
	<div class="w-full max-w-sm space-y-8">
		<header class="space-y-2 text-center">
			<p class="eyebrow">Panel</p>
			<h1 class="text-3xl">Iniciar sesión</h1>
		</header>

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
			<div class="space-y-2">
				<Label for="email">Correo</Label>
				<Input id="email" name="email" type="email" required autocomplete="username" />
			</div>

			<div class="space-y-2">
				<Label for="password">Contraseña</Label>
				<Input
					id="password"
					name="password"
					type="password"
					required
					autocomplete="current-password"
				/>
			</div>

			{#if form?.error}
				<p class="text-destructive text-sm">{form.error}</p>
			{:else if data.notice === 'sin-permiso'}
				<p class="text-destructive text-sm">Esa cuenta no tiene acceso al panel.</p>
			{/if}

			<Button type="submit" class="w-full" disabled={submitting}>
				{submitting ? 'Entrando…' : 'Entrar'}
			</Button>
		</form>

		<p class="text-muted-foreground text-center text-xs">
			<a href="/" class="hover:text-foreground underline">Volver a la tienda</a>
		</p>
	</div>
</main>
