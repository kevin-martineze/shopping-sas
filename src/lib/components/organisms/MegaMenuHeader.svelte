<script lang="ts">
	import type { Category, CategoryNode } from '$lib/domain/catalog';
	import type { Collection, StoreSettings } from '$lib/domain/settings';

	import Heart from '@lucide/svelte/icons/heart';
	import Menu from '@lucide/svelte/icons/menu';
	import Search from '@lucide/svelte/icons/search';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';

	import { goto } from '$app/navigation';
	import { SvelteMap } from 'svelte/reactivity';

	import * as Accordion from '$lib/components/atoms/accordion';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import * as Sheet from '$lib/components/atoms/sheet';
	import { buildCategoryTree } from '$lib/domain/catalog';
	import StoreBrand from '$lib/components/molecules/StoreBrand.svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { favorites } from '$lib/stores/favorites.svelte';

	interface Props {
		settings: StoreSettings;
		categories: Category[];
		collections: Collection[];
		/** Solo dentro del editor: marca la cabecera para resaltarla. */
		draftPreview?: boolean;
	}

	let { settings, categories, collections, draftPreview = false }: Props = $props();

	const tree = $derived(buildCategoryTree(categories));

	/** El grupo de colecciones no es una categoría: su id no choca con ninguna. */
	const COLLECTIONS_ID = 'colecciones';
	const COLLECTIONS_PANEL = 'mega-colecciones';

	/** La categoría raíz cuyo panel está abierto, o null. */
	let openId = $state<string | null>(null);
	let menuOpen = $state(false);
	let searchOpen = $state(false);
	let query = $state('');

	/** Cada disparador, para devolverle el foco al cerrar con Escape. */
	const triggers = new SvelteMap<string, HTMLButtonElement>();

	function register(element: HTMLButtonElement, id: string) {
		triggers.set(id, element);

		return () => triggers.delete(id);
	}

	function openPanel(id: string) {
		openId = id;
	}

	function closePanel(returnFocus: boolean) {
		const id = openId;

		openId = null;

		if (returnFocus && id) triggers.get(id)?.focus();
	}

	/** Solo al salir del grupo entero: pasar de un enlace del panel a otro no lo cierra. */
	function leaveGroup(event: FocusEvent, group: HTMLElement) {
		const next = event.relatedTarget;

		if (!(next instanceof Node) || !group.contains(next)) closePanel(false);
	}

	/**
	 * El grupo de una categoría raíz: pasar el mouse o enfocarla abre su panel;
	 * salir del grupo lo cierra; Escape lo cierra y devuelve el foco. Los
	 * listeners van sobre el elemento y no como atributos, porque un li no es
	 * interactivo para el lector de pantalla.
	 */
	function attachGroup(element: HTMLLIElement, id: string, hasChildren: boolean) {
		const enter = () => {
			if (hasChildren) openPanel(id);
		};
		const leave = () => closePanel(false);
		const focusOut = (event: FocusEvent) => leaveGroup(event, element);
		const keyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && openId) {
				event.preventDefault();
				closePanel(true);
			}
		};

		element.addEventListener('mouseenter', enter);
		element.addEventListener('mouseleave', leave);
		element.addEventListener('focusout', focusOut);
		element.addEventListener('keydown', keyDown);

		return () => {
			element.removeEventListener('mouseenter', enter);
			element.removeEventListener('mouseleave', leave);
			element.removeEventListener('focusout', focusOut);
			element.removeEventListener('keydown', keyDown);
		};
	}

	function submitSearch(event: SubmitEvent) {
		event.preventDefault();

		const term = query.trim();
		searchOpen = false;

		goto(term ? `/tienda?q=${encodeURIComponent(term)}` : '/tienda');
	}

	function categoryHref(category: Category): string {
		return `/tienda?categoria=${encodeURIComponent(category.slug)}`;
	}

	function panelId(node: CategoryNode): string {
		return `mega-${node.category.id}`;
	}
</script>

{#if settings.announcement}
	<div class="bg-primary text-primary-foreground px-4 py-2 text-center text-xs tracking-wide">
		{settings.announcement}
	</div>
{/if}

<header
	data-preview-zone={draftPreview ? 'store-header' : undefined}
	class="bg-background border-border sticky top-0 z-40 border-b"
>
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

		<a href="/" class="font-display text-2xl tracking-tight uppercase sm:text-3xl">
			<StoreBrand name={settings.store_name} logoUrl={settings.logo_url} />
		</a>

		<nav
			aria-label="Categorías"
			data-preview-zone={draftPreview ? 'categories-menu' : undefined}
			class="hidden flex-1 items-center justify-center gap-6 lg:flex"
		>
			<ul class="flex items-center gap-6">
				{#each tree as node (node.category.id)}
					<li
						{@attach (element: HTMLLIElement) =>
							attachGroup(element, node.category.id, node.children.length > 0)}
					>
						{#if node.children.length > 0}
							<button
								type="button"
								class="hover:text-foreground text-sm font-medium tracking-wide uppercase"
								aria-expanded={openId === node.category.id}
								aria-controls={openId === node.category.id ? panelId(node) : undefined}
								{@attach (element: HTMLButtonElement) => register(element, node.category.id)}
								onfocus={() => openPanel(node.category.id)}
								onclick={() =>
									openId === node.category.id ? closePanel(false) : openPanel(node.category.id)}
							>
								{node.category.name}
							</button>

							{#if openId === node.category.id}
								<div
									id={panelId(node)}
									class="bg-background border-border absolute inset-x-0 top-full z-50 border-t shadow-sm"
								>
									<div
										class="mx-auto grid max-w-7xl grid-cols-2 gap-x-10 gap-y-6 px-6 py-8 lg:grid-cols-4"
									>
										{#each node.children as child (child.category.id)}
											<div class="space-y-2">
												<a
													href={categoryHref(child.category)}
													class="hover:text-foreground text-sm font-semibold tracking-wide uppercase"
												>
													{child.category.name}
												</a>

												{#if child.children.length > 0}
													<ul class="space-y-1">
														{#each child.children as grandchild (grandchild.category.id)}
															<li>
																<a
																	href={categoryHref(grandchild.category)}
																	class="text-muted-foreground hover:text-foreground text-sm"
																>
																	{grandchild.category.name}
																</a>
															</li>
														{/each}
													</ul>
												{/if}
											</div>
										{/each}

										<a
											href={categoryHref(node.category)}
											class="text-muted-foreground hover:text-foreground col-span-full text-sm underline underline-offset-4"
										>
											Ver todo en {node.category.name}
										</a>
									</div>
								</div>
							{/if}
						{:else}
							<a
								href={categoryHref(node.category)}
								class="hover:text-foreground text-sm font-medium tracking-wide uppercase"
							>
								{node.category.name}
							</a>
						{/if}
					</li>
				{/each}
				{#if collections.length > 0}
					<li {@attach (element: HTMLLIElement) => attachGroup(element, COLLECTIONS_ID, true)}>
						<button
							type="button"
							class="hover:text-foreground text-sm font-medium tracking-wide uppercase"
							aria-expanded={openId === COLLECTIONS_ID}
							aria-controls={openId === COLLECTIONS_ID ? COLLECTIONS_PANEL : undefined}
							{@attach (element: HTMLButtonElement) => register(element, COLLECTIONS_ID)}
							onfocus={() => openPanel(COLLECTIONS_ID)}
							onclick={() =>
								openId === COLLECTIONS_ID ? closePanel(false) : openPanel(COLLECTIONS_ID)}
						>
							Colecciones
						</button>

						{#if openId === COLLECTIONS_ID}
							<div
								id={COLLECTIONS_PANEL}
								class="bg-background border-border absolute inset-x-0 top-full z-50 border-t shadow-sm"
							>
								<div
									class="mx-auto grid max-w-7xl grid-cols-2 gap-x-10 gap-y-3 px-6 py-8 lg:grid-cols-4"
								>
									{#each collections as collection (collection.id)}
										<a
											href="/colecciones/{collection.slug}"
											class="hover:text-foreground text-sm font-semibold tracking-wide uppercase"
										>
											{collection.name}
										</a>
									{/each}

									<a
										href="/colecciones"
										class="text-muted-foreground hover:text-foreground col-span-full text-sm underline underline-offset-4"
									>
										Ver todas
									</a>
								</div>
							</div>
						{/if}
					</li>
				{/if}
			</ul>
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
					placeholder="Buscar productos…"
					autofocus
					aria-label="Buscar productos"
				/>
				<Button type="submit">Buscar</Button>
			</form>
		</div>
	{/if}
</header>

<Sheet.Root bind:open={menuOpen}>
	<Sheet.Content side="left" class="w-80">
		<Sheet.Header>
			<Sheet.Title class="font-display text-2xl uppercase">
				<StoreBrand name={settings.store_name} logoUrl={settings.logo_url} />
			</Sheet.Title>
		</Sheet.Header>

		<nav aria-label="Categorías" class="px-4 pb-8">
			<Accordion.Root type="single">
				{#each tree as node (node.category.id)}
					{#if node.children.length > 0}
						<Accordion.Item value={node.category.id}>
							<Accordion.Trigger>{node.category.name}</Accordion.Trigger>
							<Accordion.Content>
								<ul class="flex flex-col gap-1">
									{#each node.children as child (child.category.id)}
										<li>
											<a
												href={categoryHref(child.category)}
												class="hover:bg-accent block px-2 py-2 text-sm"
												onclick={() => (menuOpen = false)}
											>
												{child.category.name}
											</a>
										</li>
										{#each child.children as grandchild (grandchild.category.id)}
											<li class="pl-4">
												<a
													href={categoryHref(grandchild.category)}
													class="hover:bg-accent text-muted-foreground block px-2 py-2 text-sm"
													onclick={() => (menuOpen = false)}
												>
													{grandchild.category.name}
												</a>
											</li>
										{/each}
									{/each}
								</ul>
							</Accordion.Content>
						</Accordion.Item>
					{:else}
						<a
							href={categoryHref(node.category)}
							class="hover:bg-accent block px-2 py-3 text-sm"
							onclick={() => (menuOpen = false)}
						>
							{node.category.name}
						</a>
					{/if}
				{/each}
				{#if collections.length > 0}
					<Accordion.Item value={COLLECTIONS_ID}>
						<Accordion.Trigger>Colecciones</Accordion.Trigger>
						<Accordion.Content>
							<ul class="flex flex-col gap-1">
								{#each collections as collection (collection.id)}
									<li>
										<a
											href="/colecciones/{collection.slug}"
											class="hover:bg-accent block px-2 py-2 text-sm"
											onclick={() => (menuOpen = false)}
										>
											{collection.name}
										</a>
									</li>
								{/each}
								<li>
									<a
										href="/colecciones"
										class="hover:bg-accent text-muted-foreground block px-2 py-2 text-sm"
										onclick={() => (menuOpen = false)}
									>
										Ver todas
									</a>
								</li>
							</ul>
						</Accordion.Content>
					</Accordion.Item>
				{/if}
			</Accordion.Root>

			<a
				href="/favoritos"
				class="hover:bg-accent mt-2 block px-2 py-3 text-sm"
				onclick={() => (menuOpen = false)}
			>
				Favoritos
			</a>
		</nav>
	</Sheet.Content>
</Sheet.Root>
