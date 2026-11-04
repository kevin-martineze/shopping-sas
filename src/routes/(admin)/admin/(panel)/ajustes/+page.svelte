<script lang="ts">
	import { untrack } from 'svelte';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import type { PreviewZone, StorefrontDraft } from '$lib/domain/preview';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import { Textarea } from '$lib/components/atoms/textarea';
	import LivePreviewLayout from '$lib/components/organisms/LivePreviewLayout.svelte';
	import { themePreviewUrl } from '$lib/template-preview';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	// Copia editable de los ajustes; no se sincroniza sola.
	let storeName = $state(untrack(() => data.current.store_name));
	let whatsappPhone = $state(untrack(() => data.current.whatsapp_phone));
	let instagramUrl = $state(untrack(() => data.current.instagram_url ?? ''));
	let announcement = $state(untrack(() => data.current.announcement ?? ''));
	let freeShippingThreshold = $state<number | null>(
		untrack(() => data.current.free_shipping_threshold)
	);

	let saving = $state(false);

	/** La zona de la tienda que se resalta según el campo que se está editando. */
	let focus = $state<PreviewZone>('store-header');

	const draft = $derived<StorefrontDraft>({
		template: data.current.template,
		theme: data.current.theme,
		content: {
			kind: 'settings',
			storeName,
			whatsappPhone,
			instagramUrl,
			announcement,
			freeShippingThreshold
		},
		focus
	});

	const previewSrc = $derived(
		themePreviewUrl(
			new URL('/', data.storeUrl).toString(),
			data.current.template,
			data.current.theme
		)
	);

	function readThreshold(value: string) {
		const raw = value.trim();
		const parsed = Number(raw);

		freeShippingThreshold = raw === '' || !Number.isFinite(parsed) ? null : parsed;
	}
</script>

<svelte:head>
	<title>Ajustes — Globerce</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Ajustes</h1>
	<p class="text-muted-foreground text-sm">
		Estos datos se ven en la tienda y arman el mensaje de WhatsApp.
	</p>
</header>

<LivePreviewLayout src={previewSrc} {draft} title="Así se ven tus ajustes">
	<div class="border-border bg-card rounded-lg border p-6">
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
				<Input
					id="storeName"
					name="storeName"
					bind:value={storeName}
					required
					onfocusin={() => (focus = 'store-header')}
				/>
			</div>

			<div class="space-y-2">
				<Label for="whatsappPhone">WhatsApp</Label>
				<Input
					id="whatsappPhone"
					name="whatsappPhone"
					bind:value={whatsappPhone}
					required
					placeholder="573001234567"
					onfocusin={() => (focus = 'store-footer')}
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
					bind:value={instagramUrl}
					placeholder="https://instagram.com/tu-tienda"
					onfocusin={() => (focus = 'store-footer')}
				/>
			</div>

			<div class="space-y-2">
				<Label for="announcement">Barra de anuncio</Label>
				<Textarea
					id="announcement"
					name="announcement"
					rows={2}
					maxlength={160}
					bind:value={announcement}
					placeholder="Envío gratis por compras sobre $250.000"
					onfocusin={() => (focus = 'store-header')}
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
					value={freeShippingThreshold ?? ''}
					oninput={(event) => readThreshold(event.currentTarget.value)}
					onfocusin={() => (focus = 'store-footer')}
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
</LivePreviewLayout>
