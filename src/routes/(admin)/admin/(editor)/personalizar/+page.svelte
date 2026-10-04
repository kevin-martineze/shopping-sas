<script lang="ts">
	import { untrack } from 'svelte';

	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Monitor from '@lucide/svelte/icons/monitor';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import { toast } from 'svelte-sonner';

	import { enhance } from '$app/forms';
	import { beforeNavigate } from '$app/navigation';

	import type { PageData } from './$types';
	import type { StorefrontDraft } from '$lib/storefront-draft';
	import { Button } from '$lib/components/atoms/button';
	import DraftPreview from '$lib/components/molecules/DraftPreview.svelte';
	import ThemeControls from '$lib/components/organisms/ThemeControls.svelte';
	import { accentProblem, isEmptyTheme, readTheme } from '$lib/domain/theme';
	import { themePreviewUrl } from '$lib/template-preview';
	import { cn } from '$lib/utils';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Copia editable de lo guardado; '' es «lo que diga la plantilla».
	let template = $state(untrack(() => data.settings.template));
	let accent = $state(untrack(() => data.settings.theme.accent ?? ''));
	let fonts = $state(untrack(() => data.settings.theme.fonts ?? ''));
	let corners = $state(untrack(() => data.settings.theme.corners ?? ''));
	let hero = $state(untrack(() => data.settings.theme.hero ?? ''));

	let device = $state<'desktop' | 'mobile'>('desktop');
	let path = $state('/');
	let saving = $state(false);

	const PAGES = [
		{ path: '/', label: 'Portada' },
		{ path: '/tienda', label: 'Catálogo' }
	];

	const draft = $derived<StorefrontDraft>({
		template,
		theme: readTheme({ accent, fonts, corners, hero })
	});

	const saved = $derived(data.settings);

	const changed = $derived(
		draft.template !== saved.template ||
			draft.theme.accent !== saved.theme.accent ||
			draft.theme.fonts !== saved.theme.fonts ||
			draft.theme.corners !== saved.theme.corners ||
			draft.theme.hero !== saved.theme.hero
	);

	const invalid = $derived(accentProblem(template, accent) !== null);

	/**
	 * La vista previa carga con lo guardado y el borrador le llega por mensaje;
	 * la URL solo cambia al cambiar de página, así no se recarga con cada ajuste.
	 */
	const previewSrc = $derived(
		themePreviewUrl(new URL(path, data.storeUrl).toString(), saved.template, saved.theme)
	);

	function discard() {
		template = saved.template;
		accent = saved.theme.accent ?? '';
		fonts = saved.theme.fonts ?? '';
		corners = saved.theme.corners ?? '';
		hero = saved.theme.hero ?? '';
	}

	function clearAdjustments() {
		accent = '';
		fonts = '';
		corners = '';
		hero = '';
	}

	function messageOf(data: Record<string, unknown> | undefined, key: string): string | null {
		const value = data?.[key];

		return typeof value === 'string' ? value : null;
	}

	// Salir con cambios sin guardar los perdería: se pregunta antes.
	beforeNavigate(({ cancel }) => {
		if (changed && !saving && !confirm('Tienes cambios sin guardar. ¿Salir sin guardarlos?')) {
			cancel();
		}
	});
</script>

<svelte:head>
	<title>Diseño de tu tienda — Globerce</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<form
	method="POST"
	action="?/guardar"
	class="admin-shell bg-background text-foreground flex flex-col lg:h-screen"
	use:enhance={() => {
		saving = true;

		return async ({ result, update }) => {
			await update({ reset: false });
			saving = false;

			if (result.type === 'success') {
				toast.success(messageOf(result.data, 'message') ?? 'Cambios guardados.');
			} else if (result.type === 'failure') {
				toast.error(messageOf(result.data, 'error') ?? 'No pudimos guardar los cambios.');
			}
		};
	}}
>
	<header
		class="border-border flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2.5 lg:flex-nowrap"
	>
		<Button href="/admin/portada" variant="ghost" size="sm">
			<ArrowLeft />
			Salir
		</Button>

		<div class="min-w-0">
			<h1 class="truncate text-base">Diseño de tu tienda</h1>
			<p class="text-muted-foreground truncate text-xs">
				{data.settings.store_name}
				{#if changed}· <span class="text-foreground">Cambios sin guardar</span>{/if}
			</p>
		</div>

		<div class="ml-auto flex items-center gap-1">
			<div class="bg-muted flex rounded-md p-0.5" role="group" aria-label="Página que ves">
				{#each PAGES as option (option.path)}
					<button
						type="button"
						class={cn(
							'rounded px-2.5 py-1 text-xs transition-colors',
							path === option.path
								? 'bg-background text-foreground shadow-xs'
								: 'text-muted-foreground hover:text-foreground'
						)}
						aria-pressed={path === option.path}
						onclick={() => (path = option.path)}
					>
						{option.label}
					</button>
				{/each}
			</div>

			<div class="bg-muted flex rounded-md p-0.5" role="group" aria-label="Pantalla">
				<button
					type="button"
					class={cn(
						'rounded p-1.5 transition-colors',
						device === 'desktop'
							? 'bg-background text-foreground shadow-xs'
							: 'text-muted-foreground hover:text-foreground'
					)}
					aria-pressed={device === 'desktop'}
					aria-label="Ver en computador"
					title="Computador"
					onclick={() => (device = 'desktop')}
				>
					<Monitor class="size-4" />
				</button>
				<button
					type="button"
					class={cn(
						'rounded p-1.5 transition-colors',
						device === 'mobile'
							? 'bg-background text-foreground shadow-xs'
							: 'text-muted-foreground hover:text-foreground'
					)}
					aria-pressed={device === 'mobile'}
					aria-label="Ver en celular"
					title="Celular"
					onclick={() => (device = 'mobile')}
				>
					<Smartphone class="size-4" />
				</button>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<Button href={data.storeUrl} target="_blank" rel="noopener" variant="ghost" size="sm">
				Ver mi tienda
				<ExternalLink />
			</Button>
			<Button
				type="button"
				variant="outline"
				size="sm"
				disabled={!changed || saving}
				onclick={discard}
			>
				Descartar
			</Button>
			<Button type="submit" size="sm" disabled={!changed || invalid || saving}>
				{saving ? 'Guardando…' : 'Guardar'}
			</Button>
		</div>
	</header>

	<div class="grid min-h-0 flex-1 lg:grid-cols-[22rem_minmax(0,1fr)]">
		<aside class="border-border min-h-0 overflow-y-auto border-b lg:border-r lg:border-b-0">
			<ThemeControls bind:template bind:accent bind:fonts bind:corners bind:hero />

			<div class="border-border border-t p-5">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					class="text-muted-foreground"
					disabled={isEmptyTheme(draft.theme)}
					onclick={clearAdjustments}
				>
					<RotateCcw />
					Quitar mis ajustes
				</Button>
				<p class="text-muted-foreground mt-1 px-3 text-xs">
					Deja la plantilla como viene. Se aplica al guardar.
				</p>
			</div>
		</aside>

		<section class="bg-muted/60 h-[75vh] min-h-0 p-4 lg:h-auto lg:p-6">
			<DraftPreview src={previewSrc} {draft} {device} title="Vista previa de tu tienda" />
		</section>
	</div>
</form>
