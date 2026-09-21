<script lang="ts">
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Send from '@lucide/svelte/icons/send';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import X from '@lucide/svelte/icons/x';

	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { cn } from '$lib/utils';
	import { buildWhatsAppUrl } from '$lib/utils/whatsapp';

	/**
	 * El chat de la tienda.
	 *
	 * Responde con el catálogo de ESTA tienda: quien contesta no sabe nada que
	 * no haya consultado. Cuando no sabe —o cuando la tienda agotó su cuota del
	 * mes— ofrece WhatsApp, que es como se cierra la venta igual.
	 *
	 * La conversación vive solo acá, en memoria: al cerrar la pestaña
	 * desaparece. No se guarda ni en el navegador ni en el servidor, porque es
	 * de quien está preguntando.
	 */
	interface Props {
		storeName: string;
		whatsappPhone: string;
	}

	let { storeName, whatsappPhone }: Props = $props();

	interface Turno {
		role: 'user' | 'assistant';
		content: string;
	}

	let abierto = $state(false);
	let pregunta = $state('');
	let esperando = $state(false);
	let ofrecerWhatsapp = $state(false);
	let turnos = $state<Turno[]>([]);
	let hilo = $state<HTMLDivElement | null>(null);

	const saludo = $derived(
		`Hola, soy quien atiende ${storeName}. Pregúntame por variaciones, colores o envíos.`
	);

	async function enviar(event: SubmitEvent) {
		event.preventDefault();

		const texto = pregunta.trim();

		if (!texto || esperando) return;

		turnos = [...turnos, { role: 'user', content: texto }];
		pregunta = '';
		esperando = true;
		ofrecerWhatsapp = false;
		bajar();

		try {
			const response = await fetch('/asistente', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({ messages: turnos })
			});

			const data: { reply: string; handoff: boolean } = await response.json();

			turnos = [...turnos, { role: 'assistant', content: data.reply }];
			ofrecerWhatsapp = data.handoff;
		} catch {
			// La red se cayó: se dice, no se deja el chat mudo.
			turnos = [
				...turnos,
				{
					role: 'assistant',
					content: 'Me quedé sin conexión. Escríbenos por WhatsApp y te respondemos.'
				}
			];
			ofrecerWhatsapp = true;
		} finally {
			esperando = false;
			bajar();
		}
	}

	/** El último mensaje a la vista, que es el que importa. */
	function bajar() {
		requestAnimationFrame(() => hilo?.scrollTo({ top: hilo.scrollHeight, behavior: 'smooth' }));
	}

	const whatsappHref = $derived(
		buildWhatsAppUrl(whatsappPhone, `Hola, vengo de ${storeName} y tengo una pregunta.`)
	);
</script>

<div class="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
	{#if abierto}
		<!-- La aurora va en un envoltorio SIN fondo: el resplandor vive detrás y
		     quien lleva el fondo es el panel de adentro. Al revés, el degradado
		     se ve por encima y tiñe la conversación. -->
		<div class="ai-aurora w-[min(22rem,calc(100vw-2rem))] rounded-lg">
			<div
				class="bg-background overflow-hidden rounded-lg shadow-2xl"
				role="dialog"
				aria-label="Chat de la tienda"
			>
				<div class="border-border flex items-center justify-between gap-2 border-b px-4 py-3">
					<p class="flex items-center gap-2 text-sm font-medium">
						<Sparkles class="size-4" />
						Pregúntale a {storeName}
					</p>
					<button
						type="button"
						class="text-muted-foreground hover:text-foreground"
						onclick={() => (abierto = false)}
						aria-label="Cerrar el chat"
					>
						<X class="size-4" />
					</button>
				</div>

				<div bind:this={hilo} class="max-h-[22rem] space-y-3 overflow-y-auto px-4 py-4">
					<p class="text-muted-foreground text-sm">{saludo}</p>

					{#each turnos as turno, indice (indice)}
						<p
							class={cn(
								'w-fit max-w-[85%] rounded-lg px-3 py-2 text-sm',
								turno.role === 'user'
									? 'bg-primary text-primary-foreground ml-auto'
									: 'bg-muted text-foreground'
							)}
						>
							{turno.content}
						</p>
					{/each}

					{#if esperando}
						<p class="text-muted-foreground text-sm">Escribiendo…</p>
					{/if}

					{#if ofrecerWhatsapp && !esperando}
						<a
							href={whatsappHref}
							target="_blank"
							rel="noopener"
							class="bg-whatsapp text-whatsapp-foreground inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
						>
							<MessageCircle class="size-4" />
							Seguir por WhatsApp
						</a>
					{/if}
				</div>

				<form onsubmit={enviar} class="border-border flex items-center gap-2 border-t p-3">
					<Input
						bind:value={pregunta}
						maxlength={500}
						placeholder="¿Tienen variación M?"
						aria-label="Tu pregunta"
						disabled={esperando}
					/>
					<Button type="submit" size="icon" disabled={esperando || pregunta.trim() === ''}>
						<Send class="size-4" />
						<span class="sr-only">Enviar</span>
					</Button>
				</form>
			</div>
		</div>
	{/if}

	<div class={cn('ai-aurora rounded-full', abierto && 'hidden')}>
		<Button type="button" size="lg" class="rounded-full shadow-lg" onclick={() => (abierto = true)}>
			<Sparkles class="mr-2 size-4" />
			Pregúntanos
		</Button>
	</div>
</div>
