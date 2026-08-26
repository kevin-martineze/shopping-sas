<script lang="ts">
	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import { Textarea } from '$lib/components/atoms/textarea';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let saving = $state(false);
</script>

<svelte:head>
	<title>Ajustes — Panel</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Ajustes</h1>
	<p class="text-muted-foreground text-sm">
		Estos datos se ven en la tienda y arman el mensaje de WhatsApp.
	</p>
</header>

<div class="border-border bg-background max-w-2xl border p-6">
	<form
		method="POST"
		class="space-y-5"
		use:enhance={() => {
			saving = true;

			return async ({ update }) => {
				await update({ reset: false });
				saving = false;
			};
		}}
	>
		<div class="space-y-2">
			<Label for="storeName">Nombre de la tienda</Label>
			<Input id="storeName" name="storeName" value={data.current.store_name} required />
		</div>

		<div class="space-y-2">
			<Label for="whatsappPhone">WhatsApp</Label>
			<Input
				id="whatsappPhone"
				name="whatsappPhone"
				value={data.current.whatsapp_phone}
				required
				placeholder="573001234567"
			/>
			<p class="text-muted-foreground text-xs">
				Con indicativo de país y sin símbolos. Colombia es 57.
			</p>
		</div>

		<div class="space-y-2">
			<Label for="instagramUrl">Instagram</Label>
			<Input
				id="instagramUrl"
				name="instagramUrl"
				type="url"
				value={data.current.instagram_url ?? ''}
				placeholder="https://instagram.com/tu-tienda"
			/>
		</div>

		<div class="space-y-2">
			<Label for="announcement">Barra de anuncio</Label>
			<Textarea
				id="announcement"
				name="announcement"
				rows={2}
				maxlength={160}
				value={data.current.announcement ?? ''}
				placeholder="Envío gratis por compras sobre $250.000"
			/>
			<p class="text-muted-foreground text-xs">Déjalo vacío para ocultar la barra.</p>
		</div>

		<div class="space-y-2">
			<Label for="freeShippingThreshold">Envío gratis desde</Label>
			<Input
				id="freeShippingThreshold"
				name="freeShippingThreshold"
				type="number"
				min="0"
				step="1000"
				value={data.current.free_shipping_threshold ?? ''}
				placeholder="Sin envío gratis"
			/>
		</div>

		{#if form?.error}
			<p class="text-destructive text-sm">{form.error}</p>
		{:else if form?.ok}
			<p class="text-success text-sm">Ajustes guardados.</p>
		{/if}

		<Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar ajustes'}</Button>
	</form>
</div>
