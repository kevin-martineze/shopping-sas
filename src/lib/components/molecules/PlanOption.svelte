<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Sparkles from '@lucide/svelte/icons/sparkles';

	import type { Plan } from '$lib/domain/account';
	import { planFeatures } from '$lib/domain/account';
	import { cn } from '$lib/utils';
	import { formatMoney } from '$lib/utils/money';

	/**
	 * Un plan para elegir, no para leer.
	 *
	 * A diferencia de PlanCard —la de la página de precios, que vende— esta se
	 * usa dentro del formulario: enumera lo justo para decidir entre tres, y el
	 * radio de verdad queda oculto pero presente, así el formulario sigue
	 * funcionando sin JavaScript y el teclado lo recorre como cualquier grupo.
	 */
	interface Props {
		plan: Plan;
		seleccionado: boolean;
		/** Cuántas ventajas se enumeran: aquí no caben todas. */
		ventajas?: number;
		onseleccionar: () => void;
	}

	let { plan, seleccionado, ventajas = 4, onseleccionar }: Props = $props();

	const conAsistente = $derived(plan.ai_replies_per_month > 0);
	const caracteristicas = $derived(planFeatures(plan).slice(0, ventajas));
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
			<span class="flex items-center gap-1.5 font-medium">
				{plan.name}
				{#if conAsistente}
					<Sparkles class="size-3.5" />
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

		<ul class="text-muted-foreground mt-5 space-y-2 text-xs">
			{#each caracteristicas as caracteristica (caracteristica)}
				<li class="flex gap-1.5">
					<Check class="mt-0.5 size-3 shrink-0" />
					<span>{caracteristica}</span>
				</li>
			{/each}
		</ul>
	</span>
</label>
