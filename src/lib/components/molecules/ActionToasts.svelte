<script lang="ts">
	import { toast } from 'svelte-sonner';

	import { page } from '$app/state';

	import { actionFeedback } from '$lib/domain/action-feedback';

	/**
	 * No pinta nada: avisa con toast el resultado de la última acción. Cada
	 * acción deja un `page.form` nuevo, así que dos guardados seguidos avisan
	 * dos veces; al navegar, `page.form` vuelve a null y no avisa.
	 */
	$effect(() => {
		const feedback = actionFeedback(page.form);

		if (!feedback) return;

		if (feedback.kind === 'error') {
			toast.error(feedback.text);
		} else {
			toast.success(feedback.text);
		}
	});
</script>
