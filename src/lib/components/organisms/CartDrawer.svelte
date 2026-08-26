<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';
	import X from '@lucide/svelte/icons/x';

	import { Button } from '$lib/components/atoms/button';
	import { Separator } from '$lib/components/atoms/separator';
	import * as Sheet from '$lib/components/atoms/sheet';
	import { cart } from '$lib/stores/cart.svelte';
	import { formatMoney } from '$lib/utils/money';
</script>

<Sheet.Root bind:open={cart.open}>
	<Sheet.Content side="right" class="flex w-full flex-col sm:max-w-md">
		<Sheet.Header>
			<Sheet.Title class="font-display text-2xl">Tu carrito</Sheet.Title>
			<Sheet.Description>
				Los precios se confirman en el siguiente paso, antes de enviar el pedido.
			</Sheet.Description>
		</Sheet.Header>

		{#if cart.isEmpty}
			<div class="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
				<ShoppingBag class="text-muted-foreground size-10" />
				<p class="text-muted-foreground text-sm">Todavía no has agregado prendas.</p>
				<Button href="/tienda" onclick={() => (cart.open = false)}>Ver la tienda</Button>
			</div>
		{:else}
			<div class="flex-1 overflow-y-auto px-4">
				<ul class="divide-border divide-y">
					{#each cart.lines as line (line.variantId)}
						<li class="flex gap-3 py-4">
							{#if line.preview.imageUrl}
								<img
									src={line.preview.imageUrl}
									alt={line.preview.productName}
									class="bg-muted size-20 flex-none object-cover"
									loading="lazy"
								/>
							{:else}
								<div class="bg-muted size-20 flex-none"></div>
							{/if}

							<div class="min-w-0 flex-1 space-y-1">
								<div class="flex items-start justify-between gap-2">
									<a
										href="/tienda/{line.preview.productSlug}"
										class="truncate text-sm font-medium"
										onclick={() => (cart.open = false)}
									>
										{line.preview.productName}
									</a>

									<button
										type="button"
										onclick={() => cart.remove(line.variantId)}
										aria-label="Quitar del carrito"
										class="text-muted-foreground hover:text-foreground"
									>
										<X class="size-4" />
									</button>
								</div>

								<p class="text-muted-foreground text-xs">
									{line.preview.colorName} · Talla {line.preview.sizeLabel}
								</p>

								<div class="flex items-center justify-between pt-1">
									<div class="border-border flex items-center border">
										<button
											type="button"
											onclick={() => cart.setQty(line.variantId, line.qty - 1)}
											aria-label="Quitar una unidad"
											class="hover:bg-accent grid size-7 place-items-center"
										>
											<Minus class="size-3" />
										</button>

										<span class="w-8 text-center text-sm tabular-nums">{line.qty}</span>

										<button
											type="button"
											onclick={() => cart.setQty(line.variantId, line.qty + 1)}
											aria-label="Agregar una unidad"
											class="hover:bg-accent grid size-7 place-items-center"
										>
											<Plus class="size-3" />
										</button>
									</div>

									<span class="text-sm tabular-nums">
										{formatMoney(line.preview.unitPrice * line.qty)}
									</span>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>

			<div class="border-border space-y-4 border-t px-4 py-4">
				<div class="flex items-center justify-between text-sm">
					<span class="text-muted-foreground">Subtotal estimado</span>
					<span class="tabular-nums">{formatMoney(cart.previewSubtotal)}</span>
				</div>

				<Separator />

				<Button href="/carrito" class="w-full" size="lg" onclick={() => (cart.open = false)}>
					Continuar con el pedido
				</Button>

				<button
					type="button"
					class="text-muted-foreground hover:text-foreground w-full text-xs"
					onclick={() => cart.clear()}
				>
					Vaciar carrito
				</button>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
