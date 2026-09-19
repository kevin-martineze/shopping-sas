<script lang="ts">
	import Check from '@lucide/svelte/icons/check';

	import type { Plan } from '$lib/domain/account';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { planFeatures } from '$lib/domain/account';
	import { cn } from '$lib/utils';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		plan: Plan;
		/** El plan superior se pinta con más peso: es el que se recomienda. */
		destacado?: boolean;
	}

	let { plan, destacado = false }: Props = $props();

	const caracteristicas = $derived(planFeatures(plan));
</script>

<div
	class={cn(
		'border-border bg-background border p-8',
		// El plan recomendado se lee primero: fondo oscuro, no un borde más
		// grueso, que a dos metros de la pantalla no se distingue.
		destacado && 'bg-foreground text-background border-foreground shadow-xl'
	)}
>
	<div class="flex items-center justify-between gap-3">
		<h3 class="text-xl font-medium">{plan.name}</h3>
		{#if destacado}
			<Badge variant="secondary">Recomendado</Badge>
		{/if}
	</div>

	<p class="mt-5 text-4xl font-semibold tabular-nums">
		{formatMoney(plan.price_cop)}<span
			class={cn(
				'text-base font-normal',
				destacado ? 'text-background/70' : 'text-muted-foreground'
			)}
		>
			/ mes</span
		>
	</p>

	<ul class="mt-7 space-y-3 text-sm">
		{#each caracteristicas as caracteristica (caracteristica)}
			<li class="flex items-start gap-2.5">
				<Check class={cn('mt-0.5 size-4 flex-none', destacado && 'text-background/80')} />
				<span class={destacado ? 'text-background/90' : undefined}>{caracteristica}</span>
			</li>
		{/each}
	</ul>

	<Button
		href="/registro?plan={plan.code}"
		class={cn('mt-8 w-full', destacado && 'bg-background text-foreground hover:bg-background/90')}
		variant={destacado ? 'default' : 'outline'}
	>
		Empezar con {plan.name}
	</Button>
</div>
