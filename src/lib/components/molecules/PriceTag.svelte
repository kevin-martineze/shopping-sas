<script lang="ts">
	import { cn } from '$lib/utils';
	import { discountPercent, formatMoney } from '$lib/utils/money';

	interface Props {
		price: number;
		compareAtPrice?: number | null;
		size?: 'sm' | 'md' | 'lg';
		class?: string;
	}

	let { price, compareAtPrice = null, size = 'md', class: className }: Props = $props();

	const percent = $derived(discountPercent(price, compareAtPrice));

	const sizeClass = {
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-xl'
	};
</script>

<div class={cn('flex flex-wrap items-baseline gap-2', sizeClass[size], className)}>
	<span class="tabular-nums">{formatMoney(price)}</span>

	{#if percent !== null && compareAtPrice !== null}
		<span class="text-muted-foreground text-xs line-through tabular-nums">
			{formatMoney(compareAtPrice)}
		</span>
		<span class="text-sale text-xs font-medium">-{percent}%</span>
	{/if}
</div>
