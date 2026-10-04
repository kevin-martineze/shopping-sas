<script lang="ts">
	import type { StorefrontTemplate } from '$lib/domain/templates';
	import BrandColorPicker from '$lib/components/molecules/BrandColorPicker.svelte';
	import ChoiceTile from '$lib/components/molecules/ChoiceTile.svelte';
	import { TEMPLATES, templateOf } from '$lib/domain/templates';
	import {
		accentProblem,
		CORNER_OPTIONS,
		FONT_OPTIONS,
		HERO_OPTIONS,
		HEX_COLOR
	} from '$lib/domain/theme';

	/**
	 * Los controles del editor de diseño, de arriba abajo: plantilla, color,
	 * letras, esquinas y portada.
	 *
	 * Son campos del formulario que los contiene (`name` en cada uno), así que
	 * guardar es un submit normal. Cada grupo tiene «De la plantilla» (`''`),
	 * que es no tocar ese ajuste.
	 *
	 * El color lo elige `BrandColorPicker`, que enseña qué tonos se leen sobre
	 * la plantilla elegida; uno que no se lea se avisa aquí (`accentProblem`) y
	 * lo rechaza el servidor.
	 */
	interface Props {
		template: StorefrontTemplate;
		accent: string;
		fonts: string;
		corners: string;
		hero: string;
	}

	let {
		template = $bindable(),
		accent = $bindable(),
		fonts = $bindable(),
		corners = $bindable(),
		hero = $bindable()
	}: Props = $props();

	const info = $derived(templateOf(template));
	const templateHero = $derived(HERO_OPTIONS.find((option) => option.code === info.hero));

	const accentError = $derived(accentProblem(template, accent));
</script>

<div class="divide-border divide-y">
	<fieldset class="space-y-3 p-5">
		<legend class="contents text-sm font-semibold">Plantilla</legend>

		<div class="grid gap-2">
			{#each TEMPLATES as option (option.code)}
				<ChoiceTile
					name="template"
					value={option.code}
					bind:group={template}
					label={option.name}
					hint={option.tagline}
				/>
			{/each}
		</div>
	</fieldset>

	<fieldset class="space-y-3 p-5">
		<legend class="contents text-sm font-semibold">Color de tu marca</legend>
		<p class="text-muted-foreground text-xs">Botones, enlaces y lo que se pulsa.</p>

		<BrandColorPicker bind:value={accent} {template} id="theme-accent" />
		<input type="hidden" name="accent" value={accent} />

		<!-- Que no se lea ya lo dice el selector; aquí solo un código mal escrito. -->
		{#if accentError && !HEX_COLOR.test(accent)}
			<p id="theme-accent-error" class="text-destructive text-xs">{accentError}</p>
		{/if}
	</fieldset>

	<fieldset class="space-y-3 p-5">
		<legend class="contents text-sm font-semibold">Letras</legend>

		<div class="grid grid-cols-2 gap-2">
			<ChoiceTile name="fonts" value="" bind:group={fonts} label="De la plantilla">
				{#snippet preview()}
					<span class="text-muted-foreground font-display text-2xl">Aa</span>
				{/snippet}
			</ChoiceTile>

			{#each FONT_OPTIONS as option (option.code)}
				<ChoiceTile
					name="fonts"
					value={option.code}
					bind:group={fonts}
					label={option.name}
					hint={option.hint}
				>
					{#snippet preview()}
						<span class="text-2xl" style="font-family: {option.title}">Aa</span>
					{/snippet}
				</ChoiceTile>
			{/each}
		</div>
	</fieldset>

	<fieldset class="space-y-3 p-5">
		<legend class="contents text-sm font-semibold">Esquinas</legend>

		<div class="grid grid-cols-2 gap-2">
			<ChoiceTile name="corners" value="" bind:group={corners} label="De la plantilla" />

			{#each CORNER_OPTIONS as option (option.code)}
				<ChoiceTile name="corners" value={option.code} bind:group={corners} label={option.name}>
					{#snippet preview()}
						<span
							class="border-foreground/60 bg-muted block h-6 w-10 border"
							style="border-radius: {option.radius}"
						></span>
					{/snippet}
				</ChoiceTile>
			{/each}
		</div>
	</fieldset>

	<fieldset class="space-y-3 p-5">
		<legend class="contents text-sm font-semibold">Portada</legend>

		<div class="grid grid-cols-2 gap-2">
			<ChoiceTile
				name="hero"
				value=""
				bind:group={hero}
				label="De la plantilla"
				hint={templateHero ? `Hoy: ${templateHero.name.toLowerCase()}` : undefined}
			/>

			{#each HERO_OPTIONS as option (option.code)}
				<ChoiceTile
					name="hero"
					value={option.code}
					bind:group={hero}
					label={option.name}
					hint={option.hint}
				/>
			{/each}
		</div>
	</fieldset>
</div>
