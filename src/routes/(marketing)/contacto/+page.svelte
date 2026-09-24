<script lang="ts">
	import Mail from '@lucide/svelte/icons/mail';
	import MessageCircle from '@lucide/svelte/icons/message-circle';

	import LegalPage from '$lib/components/molecules/LegalPage.svelte';
	import { EMPRESA, hayContacto } from '$lib/config/empresa';
	import { buildWhatsAppUrl } from '$lib/utils/whatsapp';
</script>

<svelte:head>
	<title>Contacto — Globerce</title>
	<meta name="description" content="Cómo hablar con el equipo de Globerce." />
</svelte:head>

<LegalPage title="Hablemos" summary="Dudas sobre los planes, ayuda con tu tienda o lo que sea.">
	{#if hayContacto()}
		<div class="space-y-3">
			{#if EMPRESA.whatsapp}
				<a
					href={buildWhatsAppUrl(EMPRESA.whatsapp, 'Hola, tengo una duda sobre Globerce.')}
					class="border-border hover:border-foreground/40 flex items-center gap-3 border p-4 transition-colors"
				>
					<MessageCircle class="size-5 flex-none" />
					<span>
						<span class="block font-medium">WhatsApp</span>
						<span class="text-muted-foreground text-sm">Lo más rápido, en horario laboral.</span>
					</span>
				</a>
			{/if}

			{#if EMPRESA.email}
				<a
					href="mailto:{EMPRESA.email}"
					class="border-border hover:border-foreground/40 flex items-center gap-3 border p-4 transition-colors"
				>
					<Mail class="size-5 flex-none" />
					<span>
						<span class="block font-medium">{EMPRESA.email}</span>
						<span class="text-muted-foreground text-sm">
							Para facturación, datos personales y todo lo que deje rastro.
						</span>
					</span>
				</a>
			{/if}
		</div>
	{:else}
		<!-- Sin datos de contacto configurados: mejor decirlo que inventar una
		     dirección que nadie lee. Se llenan en `$lib/config/empresa.ts`. -->
		<p>
			Estamos terminando de montar los canales de atención. Mientras tanto, si ya tienes una tienda,
			escríbenos desde tu panel: sabemos quién eres y te respondemos ahí mismo.
		</p>
	{/if}

	<section>
		<h2>¿Ya tienes una tienda?</h2>
		<p>
			Entra a <a href="/admin">tu panel</a>. Casi todo —cambiar de plan, invitar a tu equipo,
			cambiar la plantilla— se hace ahí sin esperar a nadie.
		</p>
	</section>

	<section>
		<h2>¿Todavía no?</h2>
		<p>
			<a href="/#precios">Mira los planes</a> o
			<a href="/registro">crea tu tienda</a>: los primeros días son gratis y no se cobra nada hasta
			que terminen.
		</p>
	</section>
</LegalPage>
