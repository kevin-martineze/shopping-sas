<script lang="ts">
	import type { StoreStatus } from '$lib/domain/account';
	import { Badge } from '$lib/components/atoms/badge';
	import { STORE_STATUS_LABEL } from '$lib/domain/account';

	interface Props {
		status: StoreStatus;
	}

	let { status }: Props = $props();

	const variant = $derived(
		status === 'active'
			? 'default'
			: status === 'suspended'
				? 'destructive'
				: status === 'past_due'
					? 'outline'
					: 'secondary'
	);
</script>

<Badge {variant}>{STORE_STATUS_LABEL[status]}</Badge>
