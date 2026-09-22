<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	import type { Plan } from '$lib/domain/account';
	import { Badge } from '$lib/components/atoms/badge';
	import { planFeatures } from '$lib/domain/account';
	import { cn } from '$lib/utils';
	import { formatMoney } from '$lib/utils/money';

	/**
	 * Un plan para elegir, dentro del formulario.
	 *
	 * Dice exactamente lo mismo que PlanCard —la de la página de precios—:
	 * la lista completa de `planFeatures`, el «Con asistente» y el
	 * «Recomendado». Antes recortaba a cuatro ventajas para que cupiera, y
	 * quien venía de leer los precios encontraba aquí un plan que parecía
	 * traer menos. Lo que cambia es la forma: el radio de verdad queda oculto
	 * pero presente, así el formulario sigue funcionando sin JavaScript y el
	 * teclado lo recorre como cualquier grupo.
	 */
	interface Props {
		plan: Plan;
		seleccionado: boolean;
		/** El plan que se recomienda: el mismo que destaca la página de precios. */
		recomendado?: boolean;
		onseleccionar: () => void;
	}

	let { plan, seleccionado, recomendado = false, onseleccionar }: Props = $props();

	const conAsistente = $derived(plan.ai_replies_per_month > 0);
	const caracteristicas = $derived(planFeatures(plan));
</script>

<label class={cn('block h-full rounded-lg', conAsistente && 'ai-aurora ai-aurora-sutil')}>
	<input
		type="radio"
		name="planCode"
		value={plan.code}
		checked={seleccionado}
		onchange={onseleccionar}
		class="peer sr-only"
	/>

	<span
		class={cn(
			'border-border bg-background flex h-full cursor-pointer flex-col rounded-lg border p-5 transition-colors',
			'peer-focus-visible:ring-ring peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
			seleccionado ? 'border-foreground bg-muted/40' : 'hover:border-foreground/40',
			// Con aurora el borde lo dibuja el envoltorio: el propio estorba.
			conAsistente && 'border-transparent'
		)}
	>
		<span class="flex items-start justify-between gap-2">
			<span class="flex flex-wrap items-center gap-2 font-medium">
				{plan.name}
				{#if recomendado}
					<Badge variant="secondary">Recomendado</Badge>
				{/if}
			</span>

			<span
				class={cn(
					'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
					seleccionado ? 'border-foreground bg-foreground text-background' : 'border-border'
				)}
			>
				{#if seleccionado}
					<Check class="size-3" />
				{/if}
			</span>
		</span>

		<span class="mt-4 block text-3xl font-semibold tabular-nums">
			{formatMoney(plan.price_cop)}<span class="text-muted-foreground text-xs font-normal">
				/ mes</span
			>
		</span>

		{#if conAsistente}
			<span class="mt-3 flex items-center gap-1.5 text-xs font-medium">
				<Sparkles class="size-3.5 flex-none" />
				Con asistente
			</span>
		{/if}

		<ul class={cn('text-muted-foreground space-y-2 text-xs', conAsistente ? 'mt-3' : 'mt-5')}>
			{#each caracteristicas as caracteristica (caracteristica)}
				<li class="flex gap-1.5">
					<Check class="mt-0.5 size-3 shrink-0" />
					<span>{caracteristica}</span>
				</li>
			{/each}
		</ul>
	</span>
</label>
