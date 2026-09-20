<script lang="ts">
	import Check from '@lucide/svelte/icons/check';

	import { enhance } from '$app/forms';

	import type { StorefrontTemplate } from '$lib/domain/templates';
	import { Button } from '$lib/components/atoms/button';
	import TemplatePreview from '$lib/components/molecules/TemplatePreview.svelte';
	import { TEMPLATES } from '$lib/domain/templates';
	import { cn } from '$lib/utils';

	/**
	 * Elegir con qué plantilla se viste la tienda.
	 *
	 * Cada opción es un `<form>` propio: se elige apretando la que se quiere y,
	 * sin JavaScript, funciona igual. La que ya está puesta no se vuelve a
	 * enviar —no haría nada— y se marca como la actual.
	 */
	interface Props {
		/** La plantilla que tiene la tienda hoy. */
		current: StorefrontTemplate;
		storeName: string;
		/** Action del form, p. ej. `?/plantilla`. */
		action: string;
		/** Texto del botón de cada opción. */
		cta?: string;
	}

	let { current, storeName, action, cta = 'Usar esta plantilla' }: Props = $props();

	let submitting = $state('');
</script>

<div class="grid gap-6 md:grid-cols-2">
	{#each TEMPLATES as template (template.code)}
		{@const elegida = template.code === current}

		<div
			class={cn(
				'border-border bg-background flex flex-col border p-5 transition-colors',
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

			<TemplatePreview template={template.code} {storeName} />

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
