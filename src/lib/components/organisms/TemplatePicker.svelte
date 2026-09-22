<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	import { enhance } from '$app/forms';

	import type { StorefrontTemplate } from '$lib/domain/templates';
	import { Button } from '$lib/components/atoms/button';
	import StorefrontFrame from '$lib/components/molecules/StorefrontFrame.svelte';
	import { TEMPLATES } from '$lib/domain/templates';
	import { previewUrl } from '$lib/template-preview';
	import { cn } from '$lib/utils';

	/**
	 * Elegir con qué plantilla se viste la tienda.
	 *
	 * Cada opción enseña la tienda de verdad —sus productos, sus textos— ya
	 * vestida con esa plantilla, en miniatura, y «Ver en mi tienda» la abre a
	 * tamaño real en una pestaña aparte para recorrerla. Nada de eso la
	 * cambia: la cambia el botón de abajo, que es un `<form>` propio por
	 * opción y funciona igual sin JavaScript. La que ya está puesta no se
	 * vuelve a enviar y se marca como la actual.
	 */
	interface Props {
		/** La plantilla que tiene la tienda hoy. */
		current: StorefrontTemplate;
		/** La dirección pública de la tienda, para las miniaturas y la vista previa. */
		storeUrl: string;
		/** Action del form, p. ej. `?/plantilla`. */
		action: string;
		/** Texto del botón de cada opción. */
		cta?: string;
	}

	let { current, storeUrl, action, cta = 'Usar esta plantilla' }: Props = $props();

	let submitting = $state('');
</script>

<div class="grid gap-6 md:grid-cols-2">
	{#each TEMPLATES as template (template.code)}
		{@const elegida = template.code === current}

		<div
			class={cn(
				'border-border bg-card flex flex-col rounded-lg border p-5 transition-colors',
				elegida && 'border-foreground'
			)}
		>
			<div class="mb-4 flex items-center justify-between gap-3">
				<h3 class="text-xl">{template.name}</h3>
				{#if elegida}
					<span class="text-muted-foreground flex items-center gap-1.5 text-xs">
						<Check class="size-4" />
						La que usas
					</span>
				{/if}
			</div>

			<StorefrontFrame
				src={previewUrl(storeUrl, template.code, true)}
				title="Tu tienda con la plantilla {template.name}"
			/>

			<a
				href={previewUrl(storeUrl, template.code)}
				target="_blank"
				rel="noopener"
				class="text-muted-foreground hover:text-foreground mt-3 inline-flex items-center gap-1.5 self-start text-sm underline-offset-4 hover:underline"
			>
				Ver en mi tienda
				<ExternalLink class="size-3.5" />
			</a>

			<p class="text-muted-foreground mt-4 text-sm">{template.tagline}</p>

			<ul class="text-muted-foreground mt-3 space-y-1.5 text-sm">
				{#each template.features as feature (feature)}
					<li class="flex items-start gap-2">
						<Check class="mt-0.5 size-3.5 flex-none" />
						<span>{feature}</span>
					</li>
				{/each}
			</ul>

			<form
				method="POST"
				{action}
				class="mt-auto pt-5"
				use:enhance={() => {
					submitting = template.code;

					return async ({ update }) => {
						await update();
						submitting = '';
					};
				}}
			>
				<input type="hidden" name="template" value={template.code} />
				<Button
					type="submit"
					class="w-full"
					variant={elegida ? 'outline' : 'default'}
					disabled={elegida || submitting !== ''}
				>
					{#if submitting === template.code}
						Aplicando…
					{:else if elegida}
						En uso
					{:else}
						{cta}
					{/if}
				</Button>
			</form>
		</div>
	{/each}
</div>
