<script lang="ts">
	import type { PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import { Separator } from '$lib/components/atoms/separator';
	import { storefrontDraft } from '$lib/stores/storefront-draft.svelte';
	import { formatMoney } from '$lib/utils/money';

	/**
	 * El carrito en borrador: lo que Envíos y Cupones necesitan ver.
	 *
	 * El carrito de verdad vive en `localStorage` y se cotiza contra la API, así
	 * que esta ruta no lo intenta replicar. Pinta el resumen con las zonas y el
	 * cupón que llegan del panel, sin totales: esos los calcula la tienda al
	 * confirmar, nunca la vista previa.
	 */
	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	interface ZoneView {
		id: string;
		name: string;
		cost: number;
		etaDays: number | null;
	}

	const zones = $derived.by((): ZoneView[] => {
		const draft = storefrontDraft.shipping;

		if (draft) {
			return draft.zones
				.filter((zone) => zone.active)
				.map((zone) => ({
					id: zone.id,
					name: zone.name,
					cost: zone.cost,
					etaDays: zone.etaDays
				}));
		}

		return data.zones.map((zone) => ({
			id: zone.id,
			name: zone.name,
			cost: zone.cost,
			etaDays: zone.eta_days
		}));
	});

	/** La zona elegida; si el borrador cambia la lista, se vuelve a la primera. */
	let pickedZoneId = $state('');

	const selectedZoneId = $derived(
		zones.some((zone) => zone.id === pickedZoneId) ? pickedZoneId : (zones.at(0)?.id ?? '')
	);

	const selectedZone = $derived(zones.find((zone) => zone.id === selectedZoneId) ?? null);

	const coupon = $derived.by(() => {
		const draft = storefrontDraft.coupon;

		if (!draft) return null;

		const code = draft.code.trim().toUpperCase();

		if (!code) return null;

		return {
			code,
			active: draft.active,
			benefit:
				draft.type === 'percent'
					? `${draft.value}% de descuento`
					: `${formatMoney(draft.value)} de descuento`,
			minimum: draft.minSubtotal > 0 ? `Compra mínima ${formatMoney(draft.minSubtotal)}` : null
		};
	});
</script>

<svelte:head>
	<title>Carrito — {data.settings.store_name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
	<header class="mb-10 space-y-2">
		<p class="eyebrow">Paso 1 de 2</p>
		<h1 class="text-4xl md:text-5xl">Tu pedido</h1>
		<p class="text-muted-foreground text-sm">
			Así se ven el envío y los cupones en el carrito. El total lo calcula la tienda al confirmar.
		</p>
	</header>

	<div class="grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
		<section class="space-y-6">
			<p
				class="text-muted-foreground border-border border border-dashed px-6 py-16 text-center text-sm"
			>
				Aquí van los productos de tu carrito. Esta vista muestra el resumen: envío y cupón.
			</p>
		</section>

		<aside class="lg:sticky lg:top-24 lg:self-start">
			<div class="border-border space-y-5 border p-5">
				<h2 class="font-display text-2xl">Resumen</h2>

				<div class="space-y-2" data-preview-zone="cart-coupon">
					<Label for="coupon">Cupón</Label>
					<div class="flex gap-2">
						<Input
							id="coupon"
							name="couponCode"
							value={coupon?.code ?? ''}
							placeholder="CÓDIGO"
							class="uppercase"
							readonly
						/>
						<Button type="button" variant="outline" disabled>Aplicar</Button>
					</div>

					{#if coupon}
						<p class={coupon.active ? 'text-success text-xs' : 'text-destructive text-xs'}>
							{coupon.active ? `Cupón ${coupon.code} aplicado.` : 'Ese cupón ya no está activo.'}
						</p>
						<p class="text-muted-foreground text-xs">
							{coupon.benefit}{coupon.minimum ? ` · ${coupon.minimum}` : ''}
						</p>
					{/if}
				</div>

				<Separator />

				<div class="space-y-2" data-preview-zone="prodhipping">
					<Label for="zone">Zona de envío</Label>
					<select
						id="zone"
						name="shippingZoneId"
						value={selectedZoneId}
						onchange={(event) => (pickedZoneId = event.currentTarget.value)}
						class="border-border bg-background focus-visible:ring-ring w-full border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
					>
						{#each zones as zone (zone.id)}
							<option value={zone.id}>
								{zone.name} — {zone.cost === 0 ? 'Gratis' : formatMoney(zone.cost)}
								{zone.etaDays ? `· ${zone.etaDays} días` : ''}
							</option>
						{/each}
					</select>

					{#if zones.length === 0}
						<p class="text-muted-foreground text-xs">
							Todavía no tienes zonas de envío disponibles.
						</p>
					{:else if selectedZone}
						<p class="text-muted-foreground text-xs">
							{selectedZone.cost === 0 ? 'Envío gratis' : `Costo ${formatMoney(selectedZone.cost)}`}
							{selectedZone.etaDays ? `· llega en ${selectedZone.etaDays} días` : ''}
						</p>
					{/if}
				</div>

				<Separator />

				<p class="text-muted-foreground text-xs">
					El subtotal, el descuento y el total los calcula la tienda con los precios del momento.
				</p>
			</div>
		</aside>
	</div>
</div>
