<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onNavigate } from '$app/navigation';

	import { Toaster } from '$lib/components/atoms/sonner';
	import '../app.css';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Transición suave entre páginas donde el navegador la soporte.
	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<Toaster position="bottom-right" />

{@render children()}
