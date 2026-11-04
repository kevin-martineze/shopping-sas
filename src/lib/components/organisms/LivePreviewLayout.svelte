<script lang="ts">
	import type { Snippet } from 'svelte';

	import Monitor from '@lucide/svelte/icons/monitor';
	import Smartphone from '@lucide/svelte/icons/smartphone';

	import type { StorefrontDraft } from '$lib/domain/preview';
	import { Button } from '$lib/components/atoms/button';
	import * as Sheet from '$lib/components/atoms/sheet';
	import DraftPreview from '$lib/components/molecules/DraftPreview.svelte';
	import { cn } from '$lib/utils';

	/**
	 * El armazón de un módulo con vista previa: el formulario a la izquierda y
	 * la tienda de verdad a la derecha.
	 *
	 * En escritorio la tienda queda pegada mientras se recorre el formulario,
	 * para no perder de vista lo que se edita. En móvil no cabe al lado: un
	 * botón abre la misma tienda en una hoja a pantalla casi completa.
	 *
	 * El formulario es de quien usa el componente —con su `action` y su
	 * `use:enhance`—; aquí solo se le da el lugar y se le pone al lado el
	 * `DraftPreview` que recibe cada cambio.
	 */
	interface Props {
		src: string;
		draft: StorefrontDraft;
		title: string;
		children: Snippet;
	}

	let { src, draft, title, children }: Props = $props();

	let device = $state<'desktop' | 'mobile'>('desktop');
	let open = $state(false);

	const DEVICES = [
		{ code: 'desktop', label: 'Ver en computador', icon: Monitor },
		{ code: 'mobile', label: 'Ver en celular', icon: Smartphone }
	] as const;

	function toggle(next: 'desktop' | 'mobile') {
		device = next;
	}
</script>

{#snippet deviceToggle()}
	<div class="bg-muted flex rounded-md p-0.5" role="group" aria-label="Pantalla">
		{#each DEVICES as option (option.code)}
			<button
				type="button"
				class={cn(
					'rounded p-1.5 transition-colors',
					device === option.code
						? 'bg-background text-foreground shadow-xs'
						: 'text-muted-foreground hover:text-foreground'
				)}
				aria-pressed={device === option.code}
				aria-label={option.label}
				title={option.label}
				onclick={() => toggle(option.code)}
			>
				<option.icon class="size-4" />
			</button>
		{/each}
	</div>
{/snippet}

<div class="grid min-h-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
	<div class="min-w-0">
		{@render children()}
	</div>

	<aside class="hidden lg:block">
		<div class="sticky top-6 space-y-3">
			<div class="flex items-center justify-between gap-3">
				<p class="text-muted-foreground text-xs">Así se ve tu tienda</p>
				{@render deviceToggle()}
			</div>

			<div class="bg-muted/60 h-[calc(100vh-10rem)] min-h-[32rem] overflow-hidden rounded-lg p-3">
				<DraftPreview {src} {draft} {device} {title} />
			</div>
		</div>
	</aside>
</div>

<Button
	type="button"
	class="fixed inset-x-4 bottom-4 z-30 shadow-lg lg:hidden"
	size="lg"
	onclick={() => (open = true)}
>
	Ver cómo queda
</Button>

<Sheet.Root bind:open>
	<Sheet.Content side="bottom" class="h-[90vh]">
		<Sheet.Header class="flex-row items-center justify-between">
			<Sheet.Title>{title}</Sheet.Title>
			{@render deviceToggle()}
		</Sheet.Header>

		<div class="min-h-0 flex-1 px-4 pb-4">
			<DraftPreview {src} {draft} device="mobile" {title} />
		</div>
	</Sheet.Content>
</Sheet.Root>
