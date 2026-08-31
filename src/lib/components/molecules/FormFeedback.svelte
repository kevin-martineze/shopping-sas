<script lang="ts">
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';

	import * as Alert from '$lib/components/atoms/alert';

	interface Props {
		/** Mensaje de error; tiene prioridad sobre el de éxito. */
		error?: string | null;
		message?: string | null;
	}

	let { error = null, message = null }: Props = $props();
</script>

{#if error}
	<Alert.Root variant="destructive" class="mb-4">
		<CircleAlert class="size-4" />
		<Alert.Description>{error}</Alert.Description>
	</Alert.Root>
{:else if message}
	<Alert.Root class="text-success mb-4">
		<CircleCheck class="size-4" />
		<Alert.Description>{message}</Alert.Description>
	</Alert.Root>
{/if}
