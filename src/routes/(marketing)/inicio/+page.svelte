<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import BellRing from '@lucide/svelte/icons/bell-ring';
	import Boxes from '@lucide/svelte/icons/boxes';
	import Check from '@lucide/svelte/icons/check';
	import Images from '@lucide/svelte/icons/images';
	import Receipt from '@lucide/svelte/icons/receipt';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Shirt from '@lucide/svelte/icons/shirt';
	import Ticket from '@lucide/svelte/icons/ticket';
	import Truck from '@lucide/svelte/icons/truck';
	import Users from '@lucide/svelte/icons/users';

	import type { PageData } from './$types';
	import { Button } from '$lib/components/atoms/button';
	import PlanCard from '$lib/components/molecules/PlanCard.svelte';
	import StorefrontMock from '$lib/components/molecules/StorefrontMock.svelte';
	import { TRIAL_DAYS } from '$lib/domain/account';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const pasos = [
		{
			titulo: 'Creas tu tienda',
			detalle: 'Nombre, WhatsApp y listo. Queda en línea en menos de cinco minutos.'
		},
		{
			titulo: 'Subes tus prendas',
			detalle: 'Fotos, tallas, colores y precios. Se ven bien en cualquier celular.'
		},
		{
			titulo: 'Compartes el enlace',
			detalle: 'En tu bio de Instagram, en los estados, donde ya tienes a tus clientas.'
		},
		{
			titulo: 'Cierras por WhatsApp',
			detalle: 'El pedido llega escrito, con tallas y total. Tú confirmas y envías.'
		}
	];

	const incluye = [
		{ icono: Shirt, titulo: 'Catálogo', detalle: 'Prendas con tallas, colores y fotos por color.' },
		{
			icono: Boxes,
			titulo: 'Inventario',
			detalle: 'Stock por talla, con aviso cuando queda poco.'
		},
		{ icono: Receipt, titulo: 'Pedidos', detalle: 'Cada pedido con su estado, desde el celular.' },
		{ icono: Ticket, titulo: 'Cupones', detalle: 'Descuentos con vencimiento y mínimo de compra.' },
		{
			icono: Truck,
			titulo: 'Envíos',
			detalle: 'Zonas con su costo y envío gratis desde un monto.'
		},
		{
			icono: Images,
			titulo: 'Colecciones',
			detalle: 'Arma looks y etiqueta prendas sobre la foto.'
		},
		{ icono: BellRing, titulo: 'Avisos', detalle: 'Quién quedó esperando una talla agotada.' },
		{ icono: Users, titulo: 'Equipo', detalle: 'Invita a quien te ayuda, con permisos distintos.' }
	];

	const preguntas = [
		{
			pregunta: '¿Cómo me pagan mis clientas?',
			respuesta:
				'Cierras la venta por WhatsApp, como ya lo haces: transferencia, Nequi o contra entrega. El pedido llega escrito y con el total calculado, así no hay malentendidos. Los pagos dentro de la tienda están en camino.'
		},
		{
			pregunta: '¿Necesito saber de tecnología?',
			respuesta:
				'No. Si sabes publicar en Instagram, sabes usar Globerce. Todo se maneja desde el celular.'
		},
		{
			pregunta: '¿Puedo usar mi propio dominio?',
			respuesta:
				'Tu tienda queda en una dirección propia desde el primer día. Conectar un dominio que ya tengas viene en el plan Pro.'
		},
		{
			pregunta: '¿Qué pasa si dejo de pagar?',
			respuesta:
				'Te avisamos antes. Tu tienda sigue en línea unos días y, si no se renueva, se pausa: nada se borra y vuelve tal cual al reactivarla.'
		},
		{
			pregunta: '¿La información es mía?',
			respuesta:
				'Sí: tus prendas, tus pedidos y tus clientas. Puedes pedir una copia cuando quieras, y los datos de tu tienda no se mezclan con los de ninguna otra.'
		}
	];

	const año = new Date().getFullYear();
</script>

<svelte:head>
	<title>Globerce — La tienda en línea de tu marca de ropa</title>
	<meta
		name="description"
		content="Catálogo con tallas y colores, inventario que se descuenta solo y pedidos que llegan escritos a tu WhatsApp. {TRIAL_DAYS} días gratis, sin comisión por venta."
	/>

	<!-- Lo que se ve cuando alguien comparte el enlace por WhatsApp, que es por
	     donde va a llegar casi todo el mundo. -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Globerce" />
	<meta property="og:title" content="Tu tienda de ropa, en internet" />
	<meta
		property="og:description"
		content="Catálogo, inventario y pedidos por WhatsApp. {TRIAL_DAYS} días gratis, sin comisión por venta."
	/>
	<meta property="og:image" content="{data.siteUrl}/og.png" />
	<meta property="og:url" content={data.siteUrl} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="marketing">
	<header class="border-border bg-background/85 sticky top-0 z-30 border-b backdrop-blur">
		<div class="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3.5 sm:px-6">
			<a href="/" class="font-display text-xl tracking-tight">Globerce</a>

			<nav class="text-muted-foreground hidden items-center gap-6 text-sm md:flex">
				<a href="#como-funciona" class="hover:text-foreground transition-colors">Cómo funciona</a>
				<a href="#incluye" class="hover:text-foreground transition-colors">Qué incluye</a>
				<a href="#precios" class="hover:text-foreground transition-colors">Precios</a>
			</nav>

			<div class="ml-auto flex items-center gap-2">
				{#if data.signedIn}
					<Button href="/admin" size="sm">Ir a mi panel</Button>
				{:else}
					<Button href="/admin/login" variant="ghost" size="sm" class="hidden sm:inline-flex">
						Entrar
					</Button>
					<Button href="/registro" size="sm">Crear mi tienda</Button>
				{/if}
			</div>
		</div>
	</header>

	<main>
		<section class="border-border border-b">
			<div
				class="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-20"
			>
				<div>
					<p class="eyebrow mb-4">Plataforma para marcas de ropa</p>
					<h1 class="text-4xl leading-[1.08] text-balance md:text-5xl lg:text-6xl">
						Vende tu ropa en línea con el orden que Instagram no te da
					</h1>
					<p class="text-muted-foreground mt-6 max-w-lg text-lg text-pretty">
						Catálogo con tallas y colores, inventario que se descuenta solo y pedidos que llegan
						escritos a tu WhatsApp. Sin comisión por venta.
					</p>

					<div class="mt-8 flex flex-wrap items-center gap-3">
						<Button href="/registro" size="lg">
							Crear mi tienda
							<ArrowRight class="ml-2 size-4" />
						</Button>
						{#if data.demoUrl}
							<Button href={data.demoUrl} variant="outline" size="lg">Ver una tienda</Button>
						{:else}
							<Button href="#precios" variant="outline" size="lg">Ver precios</Button>
						{/if}
					</div>

					<ul class="text-muted-foreground mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
						<li class="flex items-center gap-1.5">
							<Check class="size-4" />
							{TRIAL_DAYS} días gratis
						</li>
						<li class="flex items-center gap-1.5"><Check class="size-4" /> Sin tarjeta</li>
						<li class="flex items-center gap-1.5"><Check class="size-4" /> Lista hoy mismo</li>
					</ul>
				</div>

				<div class="lg:pl-4">
					<StorefrontMock />
				</div>
			</div>
		</section>

		<section id="como-funciona" class="bg-foreground text-background">
			<div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
				<p class="text-background/60 mb-3 text-xs font-medium tracking-[0.18em] uppercase">
					Cómo funciona
				</p>
				<h2 class="mb-12 max-w-2xl text-3xl md:text-4xl">De tus fotos a tu primer pedido</h2>

				<ol class="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
					{#each pasos as paso, indice (paso.titulo)}
						<li class="border-background/25 border-t pt-5">
							<span class="text-background/60 text-xs font-medium tracking-[0.18em]">
								{String(indice + 1).padStart(2, '0')}
							</span>
							<h3 class="mt-3 text-xl">{paso.titulo}</h3>
							<p class="text-background/70 mt-2 text-sm text-pretty">{paso.detalle}</p>
						</li>
					{/each}
				</ol>
			</div>
		</section>

		<section id="incluye" class="border-border border-b">
			<div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
				<p class="eyebrow mb-3">Qué incluye</p>
				<h2 class="max-w-2xl text-3xl md:text-4xl">Todo lo que hoy llevas en cuadernos</h2>
				<p class="text-muted-foreground mt-3 max-w-xl text-pretty">
					Un solo lugar para el catálogo, el inventario y los pedidos. Sin hojas de cálculo ni
					mensajes perdidos.
				</p>

				<div class="border-border mt-12 grid gap-px border sm:grid-cols-2 lg:grid-cols-4">
					{#each incluye as item (item.titulo)}
						{@const Icono = item.icono}
						<div class="bg-background outline-border p-6 outline">
							<Icono class="mb-4 size-5" />
							<h3 class="text-base">{item.titulo}</h3>
							<p class="text-muted-foreground mt-1.5 text-sm text-pretty">{item.detalle}</p>
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section id="precios" class="bg-muted/40 border-border border-b">
			<div class="mx-auto max-w-6xl px-4 py-20 sm:px-6">
				<div class="mb-12 text-center">
					<p class="eyebrow mb-3">Precios</p>
					<h2 class="text-3xl md:text-4xl">Una mensualidad, sin comisión por venta</h2>
					<p class="text-muted-foreground mx-auto mt-3 max-w-lg text-pretty">
						Empiezas con {TRIAL_DAYS} días gratis. Lo que vendas es tuyo: no cobramos porcentaje de tus
						pedidos.
					</p>
				</div>

				{#if data.plans.length === 0}
					<p
						class="text-muted-foreground border-border bg-background border border-dashed px-6 py-12 text-center"
					>
						No pudimos cargar los precios. Escríbenos y te los contamos.
					</p>
				{:else}
					<!-- Tres planes: dos columnas en tableta, tres en escritorio. -->
					<div class="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
						{#each data.plans as plan, indice (plan.code)}
							<PlanCard {plan} destacado={indice === data.plans.length - 1} />
						{/each}
					</div>
				{/if}

				<p class="text-muted-foreground mt-8 text-center text-sm">
					Al llegar a un límite no se borra nada: solo no puedes crear más hasta cambiar de plan.
				</p>
			</div>
		</section>

		<section class="border-border border-b">
			<div class="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
				<div>
					<p class="eyebrow mb-3">Preguntas</p>
					<h2 class="text-3xl md:text-4xl">Lo que nos preguntan siempre</h2>
					<p class="text-muted-foreground mt-3 text-pretty">
						¿Te queda alguna? Escríbenos antes de crear la tienda.
					</p>
				</div>

				<dl class="divide-border divide-y border-t">
					{#each preguntas as item (item.pregunta)}
						<div class="py-6">
							<dt class="font-medium">{item.pregunta}</dt>
							<dd class="text-muted-foreground mt-2 text-pretty">{item.respuesta}</dd>
						</div>
					{/each}
				</dl>
			</div>
		</section>

		<section class="border-border border-b">
			<div class="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
				<h2 class="mx-auto max-w-2xl text-3xl text-balance md:text-4xl">
					Tu próxima clienta no debería preguntar si hay talla M
				</h2>
				<p class="text-muted-foreground mx-auto mt-4 max-w-md text-pretty">
					Abre tu tienda hoy y compártela esta misma semana.
				</p>

				<div class="mt-8">
					<Button href="/registro" size="lg">
						Crear mi tienda
						<ArrowRight class="ml-2 size-4" />
					</Button>
				</div>

				<p
					class="text-muted-foreground mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
				>
					<span class="flex items-center gap-1.5">
						<ShieldCheck class="size-4" /> Tus datos son tuyos
					</span>
					<span class="flex items-center gap-1.5">
						<Check class="size-4" /> Sin comisión por venta
					</span>
					<span class="flex items-center gap-1.5">
						<Check class="size-4" /> Cancelas cuando quieras
					</span>
				</p>
			</div>
		</section>
	</main>

	<footer>
		<div
			class="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-4 px-4 py-10 text-sm sm:px-6"
		>
			<div>
				<p class="font-display text-foreground text-lg">Globerce</p>
				<p class="mt-1 text-xs">Hecho en Colombia para marcas de ropa · {año}</p>
			</div>

			<nav class="flex flex-wrap items-center gap-x-6 gap-y-2 sm:ml-auto">
				<a href="#precios" class="hover:text-foreground transition-colors">Precios</a>
				<a href="/registro" class="hover:text-foreground transition-colors">Crear mi tienda</a>
				<a href="/admin/login" class="hover:text-foreground transition-colors">Entrar</a>
				<a href="/contacto" class="hover:text-foreground transition-colors">Contacto</a>
				<a href="/terminos" class="hover:text-foreground transition-colors">Términos</a>
				<a href="/privacidad" class="hover:text-foreground transition-colors">Privacidad</a>
			</nav>
		</div>
	</footer>
</div>
