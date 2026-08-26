<script lang="ts">
	import { untrack } from 'svelte';

	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import { Separator } from '$lib/components/atoms/separator';
	import { Textarea } from '$lib/components/atoms/textarea';
	import { COUPON_REJECTION_LABEL } from '$lib/domain/settings';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let prepareForm = $state<HTMLFormElement | null>(null);
	let couponCode = $state('');
	let zoneId = $state(untrack(() => data.zones.at(0)?.id ?? ''));
	let preparing = $state(true);
	let submitting = $state(false);

	const priced = $derived(form && 'priced' in form ? form.priced : null);
	const totals = $derived(form && 'totals' in form ? form.totals : null);
	const appliedCoupon = $derived(form && 'coupon' in form ? form.coupon : null);
	const rejection = $derived(form && 'couponRejection' in form ? form.couponRejection : null);
	const checkoutError = $derived(form && 'checkoutError' in form ? form.checkoutError : null);

	const selectedZone = $derived(data.zones.find((zone) => zone.id === zoneId) ?? null);

	/**
	 * El carrito vive en localStorage, así que el servidor no puede leerlo en el
	 * load: se lo mandamos con una form action apenas monta y en cada cambio.
	 */
	$effect(() => {
		// Dependencias explícitas: cualquier cambio dispara la revalidación.
		void cart.lines.length;
		void cart.lines.map((line) => line.qty).join(',');
		void zoneId;

		prepareForm?.requestSubmit();
	});

	function serializedCart(): string {
		return cart.serialize();
	}
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
			Confirma las prendas y tus datos. Al terminar se abre WhatsApp con el pedido escrito.
		</p>
	</header>

	<!-- Revalidación silenciosa del carrito contra la base de datos. -->
	<form
		method="POST"
		action="?/preparar"
		bind:this={prepareForm}
		class="hidden"
		use:enhance={() => {
			preparing = true;

			return async ({ update }) => {
				await update({ reset: false });
				preparing = false;
			};
		}}
	>
		<input type="hidden" name="cart" value={serializedCart()} />
		<input type="hidden" name="couponCode" value={couponCode} />
		<input type="hidden" name="shippingZoneId" value={zoneId} />
	</form>

	{#if cart.isEmpty}
		<div
			class="border-border flex flex-col items-center gap-4 border border-dashed px-6 py-24 text-center"
		>
			<ShoppingBag class="text-muted-foreground size-10" />
			<h2 class="text-2xl">Tu carrito está vacío</h2>
			<Button href="/tienda">Ver la tienda</Button>
		</div>
	{:else}
		<div class="grid gap-12 lg:grid-cols-[1.3fr_0.7fr]">
			<section class="space-y-6">
				{#if priced && priced.removed.length > 0}
					<div class="border-destructive/40 bg-destructive/5 border p-4 text-sm">
						<p class="font-medium">Quitamos prendas que ya no están disponibles:</p>
						<ul class="text-muted-foreground mt-1 list-inside list-disc">
							{#each priced.removed as removed (removed.variantId)}
								<li>{removed.label}</li>
							{/each}
						</ul>
					</div>
				{/if}

				<ul class="divide-border divide-y">
					{#each cart.lines as line (line.variantId)}
						{@const server = priced?.lines.find((item) => item.variantId === line.variantId)}
						<li class="flex gap-4 py-5">
							{#if line.preview.imageUrl}
								<img
									src={line.preview.imageUrl}
									alt=""
									class="bg-muted size-24 flex-none object-cover sm:size-28"
									loading="lazy"
								/>
							{:else}
								<div class="bg-muted size-24 flex-none sm:size-28"></div>
							{/if}

							<div class="min-w-0 flex-1 space-y-2">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<a href="/tienda/{line.preview.productSlug}" class="text-sm font-medium">
											{line.preview.productName}
										</a>
										<p class="text-muted-foreground text-xs">
											{line.preview.colorName} · Talla {line.preview.sizeLabel}
										</p>
									</div>

									<button
										type="button"
										onclick={() => cart.remove(line.variantId)}
										class="text-muted-foreground hover:text-destructive"
										aria-label="Quitar prenda"
									>
										<Trash2 class="size-4" />
									</button>
								</div>

								{#if server?.adjustedFrom}
									<p class="text-sale text-xs">
										Solo quedan {server.stock}; ajustamos la cantidad.
									</p>
								{/if}

								<div class="flex items-center justify-between">
									<div class="border-border flex items-center border">
										<button
											type="button"
											onclick={() => cart.setQty(line.variantId, line.qty - 1)}
											class="hover:bg-accent grid size-8 place-items-center"
											aria-label="Quitar una unidad"
										>
											<Minus class="size-3" />
										</button>

										<span class="w-9 text-center text-sm tabular-nums">{line.qty}</span>

										<button
											type="button"
											onclick={() => cart.setQty(line.variantId, line.qty + 1)}
											class="hover:bg-accent grid size-8 place-items-center"
											disabled={server !== undefined && line.qty >= server.stock}
											aria-label="Agregar una unidad"
										>
											<Plus class="size-3" />
										</button>
									</div>

									<span class="text-sm tabular-nums">
										{formatMoney((server?.unitPrice ?? line.preview.unitPrice) * line.qty)}
									</span>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</section>

			<aside class="lg:sticky lg:top-24 lg:self-start">
				<form
					method="POST"
					action="?/confirmar"
					class="border-border space-y-5 border p-5"
					use:enhance={() => {
						submitting = true;

						return async ({ update }) => {
							await update({ reset: false });
							submitting = false;
						};
					}}
				>
					<input type="hidden" name="cart" value={serializedCart()} />

					<h2 class="font-display text-2xl">Resumen</h2>

					<div class="space-y-2 text-sm">
						<div class="flex justify-between">
							<span class="text-muted-foreground">Subtotal</span>
							<span class="tabular-nums">
								{formatMoney(totals?.subtotal ?? cart.previewSubtotal)}
							</span>
						</div>

						{#if totals && totals.discount > 0}
							<div class="text-success flex justify-between">
								<span>Descuento {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
								<span class="tabular-nums">-{formatMoney(totals.discount)}</span>
							</div>
						{/if}

						<div class="flex justify-between">
							<span class="text-muted-foreground">
								Envío {selectedZone ? `· ${selectedZone.name}` : ''}
							</span>
							<span class="tabular-nums">
								{totals && totals.shippingCost === 0
									? 'Gratis'
									: formatMoney(totals?.shippingCost ?? selectedZone?.cost ?? 0)}
							</span>
						</div>

						<Separator />

						<div class="flex justify-between text-base font-medium">
							<span>Total</span>
							<span class="tabular-nums">
								{formatMoney(totals?.total ?? cart.previewSubtotal)}
							</span>
						</div>

						{#if preparing}
							<p class="text-muted-foreground text-xs">Actualizando precios…</p>
						{/if}
					</div>

					<Separator />

					<div class="space-y-2">
						<Label for="coupon">Cupón</Label>
						<div class="flex gap-2">
							<Input
								id="coupon"
								name="couponCode"
								bind:value={couponCode}
								placeholder="CÓDIGO"
								class="uppercase"
							/>
							<Button
								type="button"
								variant="outline"
								onclick={() => prepareForm?.requestSubmit()}
								disabled={preparing}
							>
								Aplicar
							</Button>
						</div>

						{#if rejection}
							<p class="text-destructive text-xs">
								{COUPON_REJECTION_LABEL[rejection] ?? 'Ese cupón no aplica.'}
							</p>
						{:else if appliedCoupon}
							<p class="text-success text-xs">Cupón {appliedCoupon.code} aplicado.</p>
						{/if}
					</div>

					<div class="space-y-2">
						<Label for="zone">Zona de envío</Label>
						<select
							id="zone"
							name="shippingZoneId"
							bind:value={zoneId}
							required
							class="border-border bg-background focus-visible:ring-ring w-full border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
						>
							{#each data.zones as zone (zone.id)}
								<option value={zone.id}>
									{zone.name} — {zone.cost === 0 ? 'Gratis' : formatMoney(zone.cost)}
									{zone.eta_days ? `· ${zone.eta_days} días` : ''}
								</option>
							{/each}
						</select>
					</div>

					<Separator />

					<div class="space-y-3">
						<div class="space-y-2">
							<Label for="name">Nombre completo</Label>
							<Input id="name" name="name" required autocomplete="name" />
						</div>

						<div class="space-y-2">
							<Label for="phone">WhatsApp</Label>
							<Input id="phone" name="phone" required inputmode="tel" placeholder="3001234567" />
						</div>

						<div class="space-y-2">
							<Label for="city">Ciudad</Label>
							<Input id="city" name="city" autocomplete="address-level2" />
						</div>

						<div class="space-y-2">
							<Label for="address">Dirección</Label>
							<Input id="address" name="address" autocomplete="street-address" />
						</div>

						<div class="space-y-2">
							<Label for="notes">Notas</Label>
							<Textarea
								id="notes"
								name="notes"
								rows={2}
								placeholder="Punto de referencia, horario…"
							/>
						</div>
					</div>

					{#if checkoutError}
						<p class="text-destructive text-sm">{checkoutError}</p>
					{/if}

					<Button type="submit" size="lg" class="w-full" disabled={submitting || preparing}>
						{submitting ? 'Creando pedido…' : 'Confirmar y abrir WhatsApp'}
					</Button>

					<p class="text-muted-foreground text-center text-xs">
						No se cobra nada en la web. El pago se acuerda por WhatsApp.
					</p>
				</form>
			</aside>
		</div>
	{/if}
</div>
