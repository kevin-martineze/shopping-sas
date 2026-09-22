<script lang="ts">
	import type { Snippet } from 'svelte';

	import BellRing from '@lucide/svelte/icons/bell-ring';
	import Boxes from '@lucide/svelte/icons/boxes';
	import CreditCard from '@lucide/svelte/icons/credit-card';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	import Images from '@lucide/svelte/icons/images';
	import LayoutTemplate from '@lucide/svelte/icons/layout-template';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Palette from '@lucide/svelte/icons/palette';
	import LogOut from '@lucide/svelte/icons/log-out';
	import Plus from '@lucide/svelte/icons/plus';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Settings from '@lucide/svelte/icons/settings';
	import Shield from '@lucide/svelte/icons/shield';
	import Shirt from '@lucide/svelte/icons/shirt';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Truck from '@lucide/svelte/icons/truck';
	import UserRound from '@lucide/svelte/icons/user-round';
	import Users from '@lucide/svelte/icons/users';
	import Wallet from '@lucide/svelte/icons/wallet';

	import { page } from '$app/state';

	import type { LayoutData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import GloberceMark from '$lib/components/molecules/GloberceMark.svelte';
	import SubscriptionBanner from '$lib/components/molecules/SubscriptionBanner.svelte';
	import { MEMBER_ROLE_LABEL } from '$lib/domain/account';
	import { cn } from '$lib/utils';

	interface Props {
		data: LayoutData;
		children: Snippet;
	}

	let { data, children }: Props = $props();

	/**
	 * La barra lateral, en tres grupos: lo del día a día arriba y sin
	 * título, lo que se configura una vez en «Tienda», y lo administrativo
	 * en «Cuenta». La lista plana sirve al menú horizontal del celular.
	 */
	const grupos = [
		{
			titulo: null,
			links: [
				{ href: '/admin', label: 'Resumen', icon: LayoutDashboard },
				{ href: '/admin/pedidos', label: 'Pedidos', icon: Receipt },
				{ href: '/admin/productos', label: 'Productos', icon: Shirt },
				{ href: '/admin/inventario', label: 'Inventario', icon: Boxes },
				{ href: '/admin/colecciones', label: 'Colecciones', icon: Images }
			]
		},
		{
			titulo: 'Tienda',
			links: [
				{ href: '/admin/portada', label: 'Portada', icon: LayoutTemplate },
				{ href: '/admin/catalogos', label: 'Catálogos', icon: Palette },
				{ href: '/admin/cupones', label: 'Cupones', icon: Ticket },
				{ href: '/admin/envios', label: 'Envíos', icon: Truck },
				{ href: '/admin/avisos', label: 'Avisos', icon: BellRing }
			]
		},
		{
			titulo: 'Cuenta',
			links: [
				{ href: '/admin/ajustes', label: 'Ajustes', icon: Settings },
				{ href: '/admin/equipo', label: 'Equipo', icon: Users },
				{ href: '/admin/pagos', label: 'Pagos', icon: Wallet },
				{ href: '/admin/plan', label: 'Plan', icon: CreditCard },
				{ href: '/admin/cuenta', label: 'Mi cuenta', icon: UserRound }
			]
		}
	];

	const links = grupos.flatMap((grupo) => grupo.links);

	const platformLink = { href: '/plataforma', label: 'Plataforma', icon: Shield };

	function isActive(href: string): boolean {
		return href === '/admin' ? page.url.pathname === '/admin' : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="admin-shell flex min-h-screen">
	<aside class="bg-sidebar text-sidebar-foreground hidden w-64 flex-none lg:block">
		<div class="sticky top-0 flex h-screen flex-col gap-2 p-3">
			<!-- La marca y la tienda: el nombre lleva a la vitrina, que es lo que
			     la dueña quiere abrir cada dos por tres. -->
			<a
				href={data.storeUrl}
				class="hover:bg-sidebar-accent flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors"
			>
				<GloberceMark size={24} label="" />
				<span class="truncate text-sm font-semibold">{data.settings.store_name}</span>
				<ExternalLink class="text-muted-foreground ml-auto size-3.5 flex-none" />
			</a>

			<!-- La acción rápida: lo que más se crea es un producto. -->
			<Button href="/admin/productos/nuevo" size="sm" class="mt-1 h-9 w-full justify-start">
				<Plus class="size-4" />
				Nuevo producto
			</Button>

			{#if data.otherStores.length > 0}
				<!-- Una cuenta puede administrar varias tiendas. Sin esto, cambiar
				     de una a otra era escribir el subdominio a mano. -->
				<form method="POST" action="/admin/cambiar-tienda" class="px-2 pt-2">
					<label class="text-muted-foreground text-xs" for="cambiar-tienda">
						Cambiar de tienda
					</label>
					<select
						id="cambiar-tienda"
						name="storeId"
						class="border-sidebar-border bg-background mt-1 w-full rounded-md border px-2 py-1 text-sm"
						onchange={(event) => event.currentTarget.form?.requestSubmit()}
					>
						<option value="">{data.settings.store_name}</option>
						{#each data.otherStores as store (store.id)}
							<option value={store.id}>{store.name}</option>
						{/each}
					</select>
					<noscript>
						<button type="submit" class="mt-1 text-xs underline">Ir</button>
					</noscript>
				</form>
			{/if}

			<nav class="flex-1 overflow-y-auto">
				{#each grupos as grupo (grupo.titulo ?? 'principal')}
					<div class="pt-3">
						{#if grupo.titulo}
							<p class="text-muted-foreground px-2 pb-1 text-xs">{grupo.titulo}</p>
						{/if}
						{#each grupo.links as link (link.href)}
							{@const Icon = link.icon}
							<a
								href={link.href}
								class={cn(
									'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
									isActive(link.href)
										? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
										: 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
								)}
							>
								<Icon class="size-4 flex-none" />
								{link.label}

								{#if link.href === '/admin/pedidos' && data.pendingOrders > 0}
									<Badge class="ml-auto">{data.pendingOrders}</Badge>
								{/if}
							</a>
						{/each}
					</div>
				{/each}

				{#if data.isPlatformAdmin}
					{@const Icon = platformLink.icon}
					<div class="pt-3">
						<a
							href={platformLink.href}
							class="text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors"
						>
							<Icon class="size-4 flex-none" />
							{platformLink.label}
						</a>
					</div>
				{/if}
			</nav>

			<div class="border-sidebar-border space-y-2 border-t pt-3">
				<p class="text-muted-foreground truncate px-2 text-xs">
					{data.adminEmail} · {MEMBER_ROLE_LABEL[data.role]}
				</p>
				<form method="POST" action="/admin/logout">
					<Button type="submit" variant="ghost" size="sm" class="w-full justify-start">
						<LogOut class="size-4" />
						Salir
					</Button>
				</form>
			</div>
		</div>
	</aside>

	<!-- El contenido, en un panel blanco con esquinas suaves sobre el cascarón
	     gris: el `SidebarInset` de shadcn. En el celular ocupa toda la pantalla. -->
	<div class="admin-inset border-border min-w-0 flex-1 lg:my-2 lg:mr-2 lg:rounded-xl lg:border">
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
			<SubscriptionBanner notice={data.notice} />
			{@render children()}
		</main>
	</div>
</div>
