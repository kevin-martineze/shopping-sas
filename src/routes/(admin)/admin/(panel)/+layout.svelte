<script lang="ts">
	import type { Snippet } from 'svelte';

	import BellRing from '@lucide/svelte/icons/bell-ring';
	import Boxes from '@lucide/svelte/icons/boxes';
	import Images from '@lucide/svelte/icons/images';
	import LayoutTemplate from '@lucide/svelte/icons/layout-template';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Palette from '@lucide/svelte/icons/palette';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Settings from '@lucide/svelte/icons/settings';
	import Shirt from '@lucide/svelte/icons/shirt';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Truck from '@lucide/svelte/icons/truck';

	import { page } from '$app/state';

	import type { LayoutData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { cn } from '$lib/utils';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	const links = [
		{ href: '/admin', label: 'Resumen', icon: LayoutDashboard },
		{ href: '/admin/pedidos', label: 'Pedidos', icon: Receipt },
		{ href: '/admin/productos', label: 'Productos', icon: Shirt },
		{ href: '/admin/inventario', label: 'Inventario', icon: Boxes },
		{ href: '/admin/colecciones', label: 'Colecciones', icon: Images },
		{ href: '/admin/portada', label: 'Portada', icon: LayoutTemplate },
		{ href: '/admin/catalogos', label: 'Catálogos', icon: Palette },
		{ href: '/admin/cupones', label: 'Cupones', icon: Ticket },
		{ href: '/admin/envios', label: 'Envíos', icon: Truck },
		{ href: '/admin/avisos', label: 'Avisos', icon: BellRing },
		{ href: '/admin/ajustes', label: 'Ajustes', icon: Settings }
	];

	function isActive(href: string): boolean {
		return href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="bg-muted/40 flex min-h-screen">
	<aside class="bg-sidebar border-sidebar-border hidden w-60 flex-none border-r lg:block">
		<div class="sticky top-0 flex h-screen flex-col">
			<div class="border-sidebar-border border-b px-5 py-4">
				<a href="/" class="font-display text-xl">{data.settings.store_name}</a>
				<p class="text-muted-foreground text-xs">Panel</p>
			</div>

			<nav class="flex-1 space-y-0.5 p-3">
				{#each links as link (link.href)}
					{@const Icon = link.icon}
					<a
						href={link.href}
						class={cn(
							'flex items-center gap-3 px-3 py-2 text-sm transition-colors',
							isActive(link.href)
								? 'bg-sidebar-accent text-sidebar-accent-foreground'
								: 'text-muted-foreground hover:bg-sidebar-accent/60'
						)}
					>
						<Icon class="size-4" />
						{link.label}

						{#if link.href === '/admin/pedidos' && data.pendingOrders > 0}
							<Badge class="ml-auto">{data.pendingOrders}</Badge>
						{/if}
					</a>
				{/each}
			</nav>

			<div class="border-sidebar-border space-y-2 border-t p-3">
				<p class="text-muted-foreground truncate px-1 text-xs">{data.adminEmail}</p>
				<form method="POST" action="/admin/logout">
					<Button type="submit" variant="outline" size="sm" class="w-full">
						<LogOut class="mr-2 size-4" />
						Salir
					</Button>
				</form>
			</div>
		</div>
	</aside>

	<div class="min-w-0 flex-1">
		<header class="bg-background border-border sticky top-0 z-20 border-b lg:hidden">
			<div class="flex items-center gap-3 overflow-x-auto px-4 py-3">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class={cn(
							'text-sm whitespace-nowrap',
							isActive(link.href)
								? 'text-foreground underline underline-offset-4'
								: 'text-muted-foreground'
						)}
					>
						{link.label}
					</a>
				{/each}
			</div>
		</header>

		<main class="mx-auto max-w-6xl px-4 py-8 sm:px-6">
			{@render children()}
		</main>
	</div>
</div>
