<script lang="ts">
	import type { Snippet } from 'svelte';

	import LogOut from '@lucide/svelte/icons/log-out';
	import Shield from '@lucide/svelte/icons/shield';

	import type { LayoutData } from './$types';
	import { Button } from '$lib/components/atoms/button';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="admin-shell bg-muted/40 min-h-screen">
	<header class="bg-background border-border border-b">
		<div class="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
			<a href="/plataforma" class="flex items-center gap-2 font-semibold tracking-tight">
				<Shield class="size-4" />
				Plataforma
			</a>

			<div class="ml-auto flex items-center gap-3">
				{#if data.hasStores}
					<a href="/admin" class="text-muted-foreground hover:text-foreground text-sm">Mi panel</a>
				{/if}
				<span class="text-muted-foreground hidden text-xs sm:inline">{data.adminEmail}</span>
				<form method="POST" action="/admin/logout">
					<Button type="submit" variant="outline" size="sm">
						<LogOut class="mr-2 size-4" />
						Salir
					</Button>
				</form>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
		{@render children()}
	</main>
</div>
