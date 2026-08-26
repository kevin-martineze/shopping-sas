<script lang="ts">
	import type { Category } from '$lib/domain/catalog';
	import type { Collection, StoreSettings } from '$lib/domain/settings';

	import Heart from '@lucide/svelte/icons/heart';
	import Menu from '@lucide/svelte/icons/menu';
	import Search from '@lucide/svelte/icons/search';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import * as Sheet from '$lib/components/atoms/sheet';
	import { cart } from '$lib/stores/cart.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		settings: StoreSettings;
		categories: Category[];
		collections: Collection[];
	}

	let { settings, categories, collections }: Props = $props();

	let menuOpen = $state(false);
	let searchOpen = $state(false);
	let query = $state('');

	const currentPath = $derived(page.url.pathname);

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();

		const term = query.trim();
		searchOpen = false;

		goto(term ? `/tienda?q=${encodeURIComponent(term)}` : '/tienda');
	}
</script>

{#if settings.announcement}
	<div class="bg-primary text-primary-foreground px-4 py-2 text-center text-xs tracking-wide">
		{settings.announcement}
	</div>
{/if}

<header class="bg-background/95 border-border sticky top-0 z-40 border-b backdrop-blur">
	<div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
		<Button
			type="button"
			variant="ghost"
			size="icon"
			class="lg:hidden"
			onclick={() => (menuOpen = true)}
			aria-label="Abrir menú"
		>
			<Menu class="size-5" />
		</Button>

		<a href="/" class="font-display text-2xl tracking-tight sm:text-3xl">
			{settings.store_name}
		</a>

		<nav class="ml-8 hidden items-center gap-6 lg:flex">
			<a
				href="/tienda"
				class={cn(
					'hover:text-foreground text-sm transition-colors',
					currentPath === '/tienda' ? 'text-foreground' : 'text-muted-foreground'
				)}
			>
				Todo
			</a>

			{#each categories as category (category.id)}
				<a
					href="/tienda?categoria={category.slug}"
					class="text-muted-foreground hover:text-foreground text-sm transition-colors"
				>
					{category.name}
				</a>
			{/each}

			{#if collections.length > 0}
				<a
					href="/colecciones"
					class="text-muted-foreground hover:text-foreground text-sm transition-colors"
				>
					Colecciones
				</a>
			{/if}
		</nav>

		<div class="ml-auto flex items-center gap-1">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onclick={() => (searchOpen = !searchOpen)}
				aria-label="Buscar"
			>
				<Search class="size-5" />
			</Button>

			<Button href="/favoritos" variant="ghost" size="icon" aria-label="Favoritos" class="relative">
				<Heart class="size-5" />
				{#if favorites.count > 0}
					<span
						class="bg-primary text-primary-foreground absolute top-1 right-1 grid size-4 place-items-center rounded-full text-[10px]"
					>
						{favorites.count}
					</span>
				{/if}
			</Button>

			<Button
				type="button"
				variant="ghost"
				size="icon"
				onclick={() => (cart.open = true)}
				aria-label="Abrir carrito"
				class="relative"
			>
				<ShoppingBag class="size-5" />
				{#if cart.count > 0}
					<span
						class="bg-primary text-primary-foreground absolute top-1 right-1 grid size-4 place-items-center rounded-full text-[10px]"
					>
						{cart.count}
					</span>
				{/if}
			</Button>
		</div>
	</div>

	{#if searchOpen}
		<div class="border-border border-t">
			<form onsubmit={submitSearch} class="mx-auto flex max-w-7xl gap-2 px-4 py-3 sm:px-6">
				<Input
					bind:value={query}
					placeholder="Buscar prendas…"
					autofocus
					aria-label="Buscar prendas"
				/>
				<Button type="submit">Buscar</Button>
			</form>
		</div>
	{/if}
</header>

<Sheet.Root bind:open={menuOpen}>
	<Sheet.Content side="left" class="w-80">
		<Sheet.Header>
			<Sheet.Title class="font-display text-2xl">{settings.store_name}</Sheet.Title>
		</Sheet.Header>

		<nav class="flex flex-col gap-1 px-4 pb-8">
			<a
				href="/tienda"
				class="hover:bg-accent px-2 py-3 text-sm"
				onclick={() => (menuOpen = false)}
			>
				Todo
			</a>

			{#each categories as category (category.id)}
				<a
					href="/tienda?categoria={category.slug}"
					class="hover:bg-accent px-2 py-3 text-sm"
					onclick={() => (menuOpen = false)}
				>
					{category.name}
				</a>
			{/each}

			{#each collections as collection (collection.id)}
				<a
					href="/colecciones/{collection.slug}"
					class="hover:bg-accent px-2 py-3 text-sm"
					onclick={() => (menuOpen = false)}
				>
					{collection.name}
				</a>
			{/each}

			<a
				href="/favoritos"
				class="hover:bg-accent px-2 py-3 text-sm"
				onclick={() => (menuOpen = false)}
			>
				Favoritos
			</a>
		</nav>
	</Sheet.Content>
</Sheet.Root>
