<script lang="ts">
	import type { Category } from '$lib/domain/catalog';
	import type { StoreSettings } from '$lib/domain/settings';

	import Camera from '@lucide/svelte/icons/camera';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	import { buildWhatsAppUrl } from '$lib/utils/whatsapp';

	interface Props {
		settings: StoreSettings;
		categories: Category[];
	}

	let { settings, categories }: Props = $props();

	const whatsappUrl = $derived(
		buildWhatsAppUrl(
			settings.whatsapp_phone,
			`Hola ${settings.store_name}, quiero más información.`
		)
	);

	const year = new Date().getFullYear();
</script>

<footer class="border-border mt-24 border-t">
	<div class="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
		<div class="space-y-3">
			<p class="font-display text-2xl">{settings.store_name}</p>
			<p class="text-muted-foreground max-w-xs text-sm">
				Escríbenos por WhatsApp: te ayudamos con tallas, disponibilidad y envíos.
			</p>

			<div class="flex gap-3 pt-2">
				<a
					href={whatsappUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="text-muted-foreground hover:text-foreground transition-colors"
					aria-label="Escribir por WhatsApp"
				>
					<MessageCircle class="size-5" />
				</a>

				{#if settings.instagram_url}
					<a
						href={settings.instagram_url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-muted-foreground hover:text-foreground transition-colors"
						aria-label="Instagram"
					>
						<Camera class="size-5" />
					</a>
				{/if}
			</div>
		</div>

		<div class="space-y-3">
			<p class="eyebrow">Tienda</p>
			<ul class="space-y-2 text-sm">
				<li><a href="/tienda" class="text-muted-foreground hover:text-foreground">Todo</a></li>
				{#each categories as category (category.id)}
					<li>
						<a
							href="/tienda?categoria={category.slug}"
							class="text-muted-foreground hover:text-foreground"
						>
							{category.name}
						</a>
					</li>
				{/each}
			</ul>
		</div>

		<div class="space-y-3">
			<p class="eyebrow">Compra</p>
			<ul class="text-muted-foreground space-y-2 text-sm">
				<li>Pedidos y pagos se coordinan por WhatsApp.</li>
				{#if settings.free_shipping_threshold}
					<li>Envío gratis desde ${settings.free_shipping_threshold.toLocaleString('es-CO')}.</li>
				{/if}
				<li><a href="/favoritos" class="hover:text-foreground">Mis favoritos</a></li>
			</ul>
		</div>
	</div>

	<div class="border-border text-muted-foreground border-t px-4 py-6 text-center text-xs sm:px-6">
		© {year}
		{settings.store_name}. Todos los derechos reservados.
	</div>
</footer>
