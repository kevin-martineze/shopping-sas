<script lang="ts">
	import { Progress } from '$lib/components/atoms/progress';
	import { usagePercent } from '$lib/domain/account';
	import { cn } from '$lib/utils';

	interface Props {
		label: string;
		used: number;
		/** Null: el plan no tiene límite. */
		limit: number | null;
		hint?: string;
	}

	let { label, used, limit, hint }: Props = $props();

	const percent = $derived(usagePercent(used, limit));
</script>

<div class="space-y-2">
	<div class="flex items-baseline justify-between gap-4 text-sm">
		<span>{label}</span>
		<span class={cn('tabular-nums', percent !== null && percent >= 100 && 'text-destructive')}>
			{used}{limit === null ? '' : ` de ${limit}`}
		</span>
	</div>

	{#if percent === null}
		<p class="text-muted-foreground text-xs">Sin límite en tu plan.</p>
	{:else}
		<Progress value={percent} max={100} />
	{/if}

	{#if hint}
		<p class="text-muted-foreground text-xs">{hint}</p>
	{/if}
</div>
