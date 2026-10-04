<script lang="ts">
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Undo2 from '@lucide/svelte/icons/undo-2';

	import type { Hsv } from '$lib/domain/color';
	import type { StorefrontTemplate } from '$lib/domain/templates';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { hexToHsv, hsvToHex } from '$lib/domain/color';
	import { templateOf } from '$lib/domain/templates';
	import {
		accentFits,
		BRAND_COLORS,
		contrastRatio,
		HEX_COLOR,
		luminance,
		MIN_ACCENT_CONTRAST,
		readableEdge,
		readableOn
	} from '$lib/domain/theme';
	import { cn } from '$lib/utils';

	/**
	 * El color de la marca, elegido como en un editor de diseño: un área de
	 * saturación y brillo, una barra de tono, el código y unos sugeridos.
	 *
	 * Lo que lo distingue es que enseña dónde está el límite. La parte del área
	 * que no se lee sobre la plantilla se cubre con el fondo de la plantilla,
	 * así se ve cómo ese color «se pierde» en ella, y arriba se dice el
	 * contraste de verdad. Quien elige no tiene que saber qué es WCAG.
	 *
	 * `value` vacío es «el de la plantilla».
	 */
	interface Props {
		value: string;
		template: StorefrontTemplate;
		id?: string;
	}

	let { value = $bindable(), template, id = 'brand-color' }: Props = $props();

	/** El tono por defecto cuando no hay color: un azul, que no sugiere nada. */
	const DEFAULT_HUE = 215;

	/**
	 * Lo último que se eligió desde el área o la barra, con su HSV exacto. El
	 * hex redondea, y releer el HSV desde él haría temblar el cursor al
	 * arrastrar; en grises, además, se perdería el tono.
	 */
	let picked = $state<(Hsv & { hex: string }) | null>(null);

	const hasColor = $derived(HEX_COLOR.test(value));
	const hex = $derived(hasColor ? value.toUpperCase() : '');

	const current = $derived.by((): Hsv => {
		if (picked && picked.hex === hex) return picked;

		if (!hasColor) return { h: picked?.h ?? DEFAULT_HUE, s: 0.7, v: 0.5 };

		const hsv = hexToHsv(hex);

		// Un gris no tiene tono: se queda el que había para no saltar al rojo.
		return hsv.s === 0 ? { ...hsv, h: picked?.h ?? DEFAULT_HUE } : hsv;
	});

	const info = $derived(templateOf(template));
	const ratio = $derived(hasColor ? contrastRatio(info.background, hex) : null);
	const readable = $derived(ratio === null || ratio >= MIN_ACCENT_CONTRAST);
	const suggested = $derived(BRAND_COLORS.filter((color) => accentFits(template, color.hex)));

	let area = $state<HTMLDivElement>();
	let veil = $state<HTMLCanvasElement>();

	function pick(next: Hsv) {
		const nextHex = hsvToHex(next);

		picked = { ...next, hex: nextHex };
		value = nextHex;
	}

	function pickFromPointer(event: PointerEvent) {
		if (!area) return;

		const rect = area.getBoundingClientRect();
		const s = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
		const v = 1 - Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));

		pick({ h: current.h, s, v });
	}

	function onAreaKey(event: KeyboardEvent) {
		const step = event.shiftKey ? 0.1 : 0.02;
		const moves: Record<string, [number, number]> = {
			ArrowLeft: [-step, 0],
			ArrowRight: [step, 0],
			ArrowUp: [0, step],
			ArrowDown: [0, -step]
		};
		const move = moves[event.key];

		if (!move) return;

		event.preventDefault();
		pick({
			h: current.h,
			s: Math.min(1, Math.max(0, current.s + move[0])),
			v: Math.min(1, Math.max(0, current.v + move[1]))
		});
	}

	function onHexInput(raw: string) {
		const next = raw.trim().toUpperCase();

		value = next.startsWith('#') || next === '' ? next : `#${next}`;
	}

	/**
	 * El velo de la zona que no se lee: para cada columna (una saturación) se
	 * busca el brillo exacto donde el color deja de leerse (`readableEdge`) y
	 * se cubre lo que queda del otro lado con el fondo de la plantilla. Es una
	 * curva y no una rejilla, así el borde sale limpio. Se vuelve a pintar al
	 * cambiar el tono o la plantilla.
	 */
	$effect(() => {
		const context = veil?.getContext('2d');

		if (!veil || !context) return;

		const { width, height } = veil;
		const background = info.background;
		const hue = current.h;
		// Sobre fondo claro lo ilegible es lo claro (arriba); sobre oscuro, lo oscuro.
		const covered = luminance(background) < 0.5 ? height : 0;

		context.clearRect(0, 0, width, height);
		context.fillStyle = background;
		context.globalAlpha = 0.8;
		context.beginPath();
		context.moveTo(0, covered);

		for (let x = 0; x <= width; x += 4) {
			context.lineTo(x, (1 - readableEdge(background, hue, x / width)) * height);
		}

		context.lineTo(width, covered);
		context.closePath();
		context.fill();
	});
</script>

<div class="space-y-3">
	<div class="flex items-center gap-3">
		<div
			class={cn(
				'ring-border grid size-11 flex-none place-items-center rounded-lg text-sm font-semibold ring-1',
				!hasColor && 'bg-muted text-muted-foreground'
			)}
			style={hasColor ? `background-color: ${hex}; color: ${readableOn(hex)}` : undefined}
			aria-hidden="true"
		>
			Aa
		</div>

		<div class="min-w-0 flex-1">
			<p class="truncate text-sm font-medium">
				{hasColor ? hex : 'El de la plantilla'}
			</p>
			{#if ratio !== null}
				<p
					class={cn(
						'flex items-center gap-1 text-xs',
						readable ? 'text-success' : 'text-destructive'
					)}
				>
					{#if readable}
						<CircleCheck class="size-3.5" />
						Se lee bien
					{:else}
						<TriangleAlert class="size-3.5" />
						No se lee sobre {info.name}
					{/if}
					<span class="text-muted-foreground tabular-nums">
						· {ratio.toLocaleString('es-CO', { maximumFractionDigits: 1 })}:1
					</span>
				</p>
			{:else}
				<p class="text-muted-foreground text-xs">Elige uno abajo para cambiarlo</p>
			{/if}
		</div>

		<Button
			type="button"
			variant="ghost"
			size="sm"
			disabled={value === ''}
			onclick={() => (value = '')}
			title="Volver al color de la plantilla"
		>
			<Undo2 />
			<span class="sr-only">Volver al color de la plantilla</span>
		</Button>
	</div>

	<div
		bind:this={area}
		{id}
		role="slider"
		tabindex="0"
		aria-label="Saturación y brillo del color"
		aria-valuenow={Math.round(current.s * 100)}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuetext={hasColor ? hex : 'Sin color: el de la plantilla'}
		class="color-area ring-border focus-visible:ring-ring relative h-36 cursor-crosshair touch-none overflow-hidden rounded-lg ring-1 focus-visible:ring-2 focus-visible:outline-none"
		style="--hue: {current.h}"
		onpointerdown={(event) => {
			area?.setPointerCapture(event.pointerId);
			pickFromPointer(event);
		}}
		onpointermove={(event) => {
			if (area?.hasPointerCapture(event.pointerId)) pickFromPointer(event);
		}}
		onkeydown={onAreaKey}
	>
		<canvas
			bind:this={veil}
			width="320"
			height="144"
			class="pointer-events-none absolute inset-0 size-full"
			aria-hidden="true"
		></canvas>

		{#if hasColor}
			<span
				class="color-area-thumb pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
				style="left: {current.s * 100}%; top: {(1 - current.v) * 100}%; background-color: {hex}"
			></span>
		{/if}
	</div>

	<p class="text-muted-foreground text-xs">
		La zona apagada no se lee bien sobre el fondo de {info.name}.
	</p>

	<input
		type="range"
		min="0"
		max="359"
		value={Math.round(current.h)}
		oninput={(event) =>
			pick({
				h: Number(event.currentTarget.value),
				s: hasColor ? current.s : 0.7,
				v: hasColor ? current.v : 0.5
			})}
		class="hue-slider w-full"
		aria-label="Tono del color"
	/>

	<div class="flex items-center gap-2">
		<label for="{id}-hex" class="text-muted-foreground text-xs">Código</label>
		<Input
			id="{id}-hex"
			{value}
			oninput={(event) => onHexInput(event.currentTarget.value)}
			placeholder="#1D4ED8"
			maxlength={7}
			class="h-8 font-mono text-sm uppercase"
			aria-invalid={!readable || (value !== '' && !hasColor)}
		/>
	</div>

	<div class="space-y-1.5">
		<p class="text-muted-foreground text-xs">Sugeridos para {info.name}</p>
		<div class="flex flex-wrap gap-1.5">
			{#each suggested as color (color.hex)}
				<button
					type="button"
					class={cn(
						'ring-border size-6 rounded-full ring-1 transition-transform hover:scale-110',
						hex === color.hex && 'ring-ring ring-offset-background ring-2 ring-offset-2'
					)}
					style="background-color: {color.hex}"
					aria-label="Usar {color.name}"
					aria-pressed={hex === color.hex}
					title={color.name}
					onclick={() => (value = color.hex)}
				></button>
			{/each}
		</div>
	</div>
</div>
