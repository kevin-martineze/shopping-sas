<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import Info from '@lucide/svelte/icons/info';

	import type { SubscriptionNotice } from '$lib/domain/account';
	import * as Alert from '$lib/components/atoms/alert';
	import { cn } from '$lib/utils';

	interface Props {
		notice: SubscriptionNotice | null;
	}

	let { notice }: Props = $props();
</script>

{#if notice}
	<Alert.Root
		variant={notice.tone === 'danger' ? 'destructive' : 'default'}
		class={cn('mb-6', notice.tone === 'warning' && 'border-sale text-sale')}
	>
		{#if notice.tone === 'info'}
			<Info class="size-4" />
		{:else}
			<CircleAlert class="size-4" />
		{/if}
		<Alert.Description class="flex flex-wrap items-center gap-x-2">
			{notice.text}
			<a href="/admin/plan" class="font-medium underline underline-offset-4">Ver mi plan</a>
		</Alert.Description>
	</Alert.Root>
{/if}
