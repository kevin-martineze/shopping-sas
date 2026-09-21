<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Sparkles from '@lucide/svelte/icons/sparkles';

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
	/** Los planes con asistente se enmarcan con la aurora: es lo que los distingue. */
	const conAsistente = $derived(plan.ai_replies_per_month > 0);
</script>

<div class={cn('h-full rounded-lg', conAsistente && 'ai-aurora')}>
	<div
		class={cn(
			'border-border bg-background flex h-full flex-col rounded-lg border p-8',
			// El plan recomendado se lee primero: fondo oscuro, no un borde más
			// grueso, que a dos metros de la pantalla no se distingue.
			destacado && 'bg-foreground text-background border-foreground shadow-xl',
			// Con aurora el borde lo dibuja el envoltorio: el propio estorba.
			conAsistente && 'border-transparent'
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

		{#if conAsistente}
			<p
				class={cn(
					'mt-5 flex items-center gap-2 text-sm font-medium',
					destacado ? 'text-background' : 'text-foreground'
				)}
			>
				<Sparkles class="size-4 flex-none" />
				Con asistente
			</p>
		{/if}

		<ul class={cn('mb-8 space-y-3 text-sm', conAsistente ? 'mt-4' : 'mt-7')}>
			{#each caracteristicas as caracteristica (caracteristica)}
				<li class="flex items-start gap-2.5">
					<Check class={cn('mt-0.5 size-4 flex-none', destacado && 'text-background/80')} />
					<span class={destacado ? 'text-background/90' : undefined}>{caracteristica}</span>
				</li>
			{/each}
		</ul>

		<Button
			href="/registro?plan={plan.code}"
			class={cn(
				// `mt-auto` empuja el botón abajo para que los tres se alineen
				// entre tarjetas; `pt-8` garantiza aire aunque la lista sea larga
				// y no quede espacio libre que repartir. Con `mt-8` no bastaba:
				// `mt-auto` lo pisa y el botón quedaba pegado al último ítem.
				'mt-auto w-full',
				destacado
					? 'bg-background text-foreground hover:bg-background/90'
					: // El contorneado por defecto casi no se ve sobre la tarjeta
						// blanca: el borde se refuerza y al pasar por encima se
						// invierte, que es lo que lo hace parecer un botón.
						'border-foreground hover:bg-foreground hover:text-background'
			)}
			variant={destacado ? 'default' : 'outline'}
		>
			Empezar con {plan.name}
		</Button>
	</div>
</div>
