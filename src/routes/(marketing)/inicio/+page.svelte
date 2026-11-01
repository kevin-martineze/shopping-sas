<script lang="ts">
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Check from '@lucide/svelte/icons/check';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Coffee from '@lucide/svelte/icons/coffee';
	import Shirt from '@lucide/svelte/icons/shirt';
	import Zap from '@lucide/svelte/icons/zap';

	import type { PageData } from './$types';
	import type { Rubro } from '$lib/components/molecules/VariantDemo.svelte';
	import * as Accordion from '$lib/components/atoms/accordion';
	import { Button } from '$lib/components/atoms/button';
	import ModuleIcon, { type ModuleName } from '$lib/components/molecules/ModuleIcon.svelte';
	import OrderCard from '$lib/components/molecules/OrderCard.svelte';
	import PaymentCard from '$lib/components/molecules/PaymentCard.svelte';
	import PlanCard from '$lib/components/molecules/PlanCard.svelte';
	import SectionTag from '$lib/components/molecules/SectionTag.svelte';
	import StockCard from '$lib/components/molecules/StockCard.svelte';
	import StoreShowcase from '$lib/components/molecules/StoreShowcase.svelte';
	import VariantDemo from '$lib/components/molecules/VariantDemo.svelte';
	import MarketingFooter from '$lib/components/organisms/MarketingFooter.svelte';
	import MarketingHeader from '$lib/components/organisms/MarketingHeader.svelte';
	import SmoothScroll from '$lib/components/organisms/SmoothScroll.svelte';
	import {
		CAPTURA_CATALOGO_CELULAR,
		CAPTURA_DESTACADOS,
		CAPTURA_PORTADA,
		CAPTURA_PRODUCTO_CELULAR
	} from '$lib/config/capturas';
	import { FOTO_CLIENTA_NOCHE, FOTO_EMPRENDEDORA, FOTO_RUBRO } from '$lib/config/fotos';
	import { TRIAL_DAYS } from '$lib/domain/account';
	import { cn } from '$lib/utils';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	/**
	 * Los cuatro módulos que se enseñan arriba, con los iconos del brandkit.
	 * Los demás —cupones, colecciones, avisos, equipo— se nombran en una
	 * línea: cuatro fichas y una cifra caben de un vistazo; ocho, no.
	 */
	const modulos: { modulo: ModuleName; titulo: string; detalle: string }[] = [
		{
			modulo: 'catalogo',
			titulo: 'Catálogo',
			detalle: 'Cada producto se divide por lo que tú decidas: talla, color, peso, formato.'
		},
		{
			modulo: 'inventario',
			titulo: 'Inventario',
			detalle: 'Existencias por variación, con aviso cuando queda poco.'
		},
		{
			modulo: 'pedidos',
			titulo: 'Pedidos',
			detalle: 'Pagados en línea o por WhatsApp, cada uno con su estado.'
		},
		{
			modulo: 'envios',
			titulo: 'Envíos',
			detalle: 'Zonas con su costo y envío gratis desde un monto.'
		}
	];

	/**
	 * Tres rubros que se dividen distinto. Decir «sirve para cualquier
	 * producto» no convence a nadie; ver la ficha cambiar, sí.
	 */
	const rubros: {
		id: Rubro;
		icono: typeof Shirt;
		nombre: string;
		eje: string;
		titulo: string;
		detalle: string;
	}[] = [
		{
			id: 'ropa',
			icono: Shirt,
			nombre: 'Ropa y calzado',
			eje: 'Talla y color',
			titulo: 'Una blusa se vende por talla y color',
			detalle:
				'Cada combinación con su existencia. Cuando se acaba la M verde, la tienda lo dice sola y sigue vendiendo las demás.'
		},
		{
			id: 'cafe',
			icono: Coffee,
			nombre: 'Café y alimentos',
			eje: 'Molienda y peso',
			titulo: 'Un café, por molienda y por peso',
			detalle:
				'Tú declaras los ejes que uses y el precio de cada presentación. La tienda arma las opciones; tú no repites productos.'
		},
		{
			id: 'unico',
			icono: BookOpen,
			nombre: 'Libros y piezas únicas',
			eje: 'Sin variaciones',
			titulo: 'Un libro no se divide en nada',
			detalle:
				'Productos de una sola existencia, sin talla ni color. Se venden una vez y salen de la vitrina solos.'
		}
	];

	/** Lo que de verdad pide el registro para tener la tienda andando. */
	const pasos = ['Nombras tu tienda', 'Subes fotos y precios', 'Compartes el enlace'];

	let rubroActivo = $state(0);
	const rubro = $derived(rubros[rubroActivo]);

	const garantias = [
		{
			titulo: 'Tus datos son tuyos',
			detalle:
				'Productos, pedidos y clientes. Pides una copia cuando quieras y no se mezclan con los de ninguna otra tienda.'
		},
		{
			titulo: 'Sin comisión por venta',
			detalle: 'Pagas la mensualidad y nada más. Lo que vendas es tuyo, venda lo que venda.'
		},
		{
			titulo: 'Cancelas cuando quieras',
			detalle: 'Si no renuevas, la tienda se pausa: nada se borra y vuelve tal cual al reactivarla.'
		}
	];

	const preguntas = [
		{
			pregunta: '¿Sirve si no vendo ropa?',
			respuesta:
				'Sí. Cada producto declara cómo se divide: talla y color, molienda y peso, presentación, o nada si no se divide. Globerce empezó con tiendas de ropa y hoy sirve igual para café, libros, cosmética o artesanías.'
		},
		{
			pregunta: '¿Cómo me pagan mis clientes?',
			respuesta:
				'En línea, con tarjeta, transferencia o billetera: conectas tu cuenta de Wompi desde el panel y la plata llega directo a ti, sin pasar por nosotros. Quien prefiera escribirte por WhatsApp también puede, y el pedido le llega escrito con el total.'
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
				'Sí: tus productos, tus pedidos y tus clientes. Puedes pedir una copia cuando quieras, y los datos de tu tienda no se mezclan con los de ninguna otra.'
		}
	];
</script>

<svelte:head>
	<title>Globerce — Que te compren sin esperar tu respuesta</title>
	<meta
		name="description"
		content="Crea tu tienda online en minutos: subes tus fotos, pones precios y compartes el enlace. Pagos en línea directo a tu cuenta, {TRIAL_DAYS} días gratis y sin comisión por venta."
	/>

	<!-- Lo que se ve cuando alguien comparte el enlace por WhatsApp, que es por
	     donde va a llegar casi todo el mundo. -->
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Globerce" />
	<meta property="og:title" content="Que te compren sin esperar tu respuesta" />
	<meta
		property="og:description"
		content="Crea tu tienda online en minutos, vendas ropa, café o libros. {TRIAL_DAYS} días gratis, sin comisión por venta."
	/>
	<meta property="og:image" content="{data.siteUrl}/og.png" />
	<meta property="og:url" content={data.siteUrl} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="marketing">
	<MarketingHeader signedIn={data.signedIn} />

	<SmoothScroll>
		<main>
			<!-- Portada en pizarra. Arriba, lo que se promete: la tienda hecha en
			     minutos. El titular dice para qué sirve, el subtítulo cómo se hace
			     y los tres pasos lo confirman de un vistazo. Debajo, una tienda de
			     verdad —lo que ve la clienta— con el pedido que acaba de llegar
			     flotando encima —lo que ve la dueña—. La tienda es una foto
			     (`StoreShowcase`); el pedido es HTML. -->
			<section
				class="marketing-dark bg-background text-foreground overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24"
			>
				<div class="mx-auto max-w-6xl px-4 text-center sm:px-6" data-reveal>
					<p
						class="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
					>
						<Zap class="size-4" aria-hidden="true" />
						Tu tienda online en minutos · {TRIAL_DAYS} días gratis
					</p>

					<h1
						class="mx-auto mt-6 max-w-4xl text-4xl text-balance sm:text-5xl md:text-6xl lg:text-7xl"
					>
						Que te compren <em class="text-primary">sin esperar tu respuesta</em>
					</h1>

					<p class="text-muted-foreground mx-auto mt-6 max-w-xl text-lg text-pretty md:text-xl">
						Subes tus fotos, pones precios y compartes el enlace: Globerce arma tu tienda y te pagan
						en línea. Sin saber de tecnología y sin comisión por venta.
					</p>

					<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
						<Button href="/registro" size="lg" class="h-12 px-7 text-base">
							Crea tu tienda gratis
							<ArrowRight class="size-4" />
						</Button>
						{#if data.demoUrl}
							<Button href={data.demoUrl} variant="outline" size="lg" class="h-12 px-7 text-base">
								Ver una tienda
							</Button>
						{:else}
							<Button href="#precios" variant="outline" size="lg" class="h-12 px-7 text-base">
								Ver precios
							</Button>
						{/if}
					</div>

					<ol
						class="text-muted-foreground mt-10 flex flex-col items-center justify-center gap-3 text-sm sm:flex-row sm:gap-4"
					>
						{#each pasos as paso, indice (paso)}
							<li class="flex items-center gap-2.5">
								<span
									class="bg-secondary text-foreground flex size-7 flex-none items-center justify-center rounded-full text-xs font-semibold tabular-nums"
								>
									{indice + 1}
								</span>
								{paso}
								{#if indice < pasos.length - 1}
									<ChevronRight class="hidden size-4 opacity-50 sm:block" aria-hidden="true" />
								{/if}
							</li>
						{/each}
					</ol>
				</div>

				<div class="relative mx-auto mt-12 max-w-5xl px-4 sm:px-6 lg:mt-16">
					<StoreShowcase desktop={CAPTURA_PORTADA} mobile={CAPTURA_CATALOGO_CELULAR} eager />

					<!-- Solo en pantallas grandes: en el celular taparía la tienda. -->
					<div class="float absolute -bottom-4 -left-10 hidden w-80 lg:block xl:-left-24">
						<OrderCard />
					</div>
				</div>
			</section>

			<!-- Cuatro módulos y una cifra: la celda del medio no es una función,
			     es lo que no cobramos. -->
			<section id="incluye" class="py-16 md:py-24">
				<div class="mx-auto max-w-6xl px-4 sm:px-6" data-reveal>
					<h2 class="mx-auto max-w-lg text-center text-3xl text-balance md:text-4xl">
						Todo lo que hoy llevas en cuadernos, <span class="text-muted-foreground"
							>en un solo lugar</span
						>
					</h2>

					<ul class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5" data-reveal-group>
						{#each modulos as item, indice (item.modulo)}
							{#if indice === 2}
								<li
									class="bg-primary text-primary-foreground flex flex-col justify-between gap-8 rounded-lg p-6 sm:col-span-2 lg:col-span-1"
								>
									<p class="text-6xl font-semibold tabular-nums">$0</p>
									<p class="text-sm font-medium">de comisión por venta. Lo que vendas es tuyo.</p>
								</li>
							{/if}
							<li class="bg-secondary flex flex-col justify-between gap-8 rounded-lg p-6">
								<ModuleIcon
									name={item.modulo}
									class="size-10 rounded-[calc(var(--radius)-8px)] [&_svg]:size-10"
								/>
								<div>
									<h3 class="text-lg font-semibold">{item.titulo}</h3>
									<p class="text-muted-foreground mt-1.5 text-sm text-pretty">{item.detalle}</p>
								</div>
							</li>
						{/each}
					</ul>

					<p class="text-muted-foreground mt-6 text-center text-sm">
						Y también cupones, colecciones, avisos de reposición y equipo con permisos.
					</p>
				</div>
			</section>

			<!-- Cómo funciona, en tres piezas: la vitrina grande y dos fichas. -->
			<section id="como-funciona" class="py-16 md:py-24">
				<div class="mx-auto max-w-6xl px-4 sm:px-6">
					<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between" data-reveal>
						<div class="max-w-2xl">
							<SectionTag label="Cómo funciona" />
							<h2 class="mt-3 text-3xl md:text-5xl">De tus fotos a tu primer pedido</h2>
							<p class="text-muted-foreground mt-4 text-lg text-pretty">
								Tres pasos. Sin saber de tecnología.
							</p>
						</div>
						<Button href="/registro" size="lg" class="h-12 px-7 text-base">
							Empieza gratis
							<ArrowRight class="size-4" />
						</Button>
					</div>

					<div
						class="marketing-dark bg-background text-foreground mt-10 grid gap-8 overflow-hidden rounded-lg p-6 md:p-12 lg:grid-cols-[1fr_1.2fr] lg:items-center"
						data-reveal
					>
						<div>
							<p class="text-primary text-sm font-semibold tabular-nums">01</p>
							<h3 class="mt-2 text-2xl md:text-3xl">Subes tus productos y ya tienes tienda</h3>
							<p class="text-muted-foreground mt-3 text-pretty">
								Fotos, precios y las variaciones que uses. Queda en tu dirección propia, lista para
								ponerla en tu bio.
							</p>
							{#if data.demoUrl}
								<Button href={data.demoUrl} variant="outline" class="mt-6 h-11 px-6">
									Ver una tienda
								</Button>
							{/if}
						</div>
						<div class="lg:pl-4">
							<StoreShowcase desktop={CAPTURA_DESTACADOS} mobile={CAPTURA_PRODUCTO_CELULAR} />
						</div>
					</div>

					<div class="mt-4 grid gap-4 lg:grid-cols-12" data-reveal-group>
						<div class="bg-secondary flex flex-col gap-8 rounded-lg p-6 md:p-8 lg:col-span-7">
							<div class="mx-auto w-full max-w-sm">
								<StockCard />
							</div>
							<div>
								<p class="text-primary text-sm font-semibold tabular-nums">02</p>
								<h3 class="mt-2 text-xl md:text-2xl">El inventario se descuenta solo</h3>
								<p class="text-muted-foreground mt-2 text-pretty">
									Cada venta baja la existencia de esa variación. Cuando queda poco te avisa; cuando
									se agota, la tienda lo dice por ti.
								</p>
							</div>
						</div>

						<div class="bg-secondary flex flex-col gap-8 rounded-lg p-6 md:p-8 lg:col-span-5">
							<div class="mx-auto w-full max-w-xs">
								<PaymentCard />
							</div>
							<div>
								<p class="text-primary text-sm font-semibold tabular-nums">03</p>
								<h3 class="mt-2 text-xl md:text-2xl">Te pagan en línea, directo a tu cuenta</h3>
								<p class="text-muted-foreground mt-2 text-pretty">
									Tarjeta, transferencia o billetera, con tu propia cuenta de Wompi. Quien prefiera
									escribirte por WhatsApp, también puede.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Banda oscura: el panel cabe en el celular. A la derecha, la dueña
			     empacando un pedido con el celular en la mano, y encima, en claro
			     para que se lea sobre la pizarra, el pedido que le acaba de llegar. -->
			<section
				id="celular"
				class="marketing-dark bg-background text-foreground overflow-hidden py-16 md:py-24"
			>
				<div class="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-2 md:items-center">
					<div data-reveal>
						<SectionTag label="Desde el celular" />
						<h2 class="mt-3 text-3xl md:text-5xl">Todo desde tu celular</h2>
						<p class="text-muted-foreground mt-4 text-lg text-pretty">
							El pedido te llega, lo confirmas y lo despachas sin abrir un computador.
						</p>

						<ul class="mt-8 space-y-4">
							{#each ['Subes las fotos desde la galería.', 'Cada pedido llega escrito, con el total y el envío.', 'Invitas a quien te ayuda, con su propio acceso.'] as punto (punto)}
								<li class="flex items-start gap-3">
									<Check class="text-primary mt-0.5 size-5 flex-none" aria-hidden="true" />
									<span>{punto}</span>
								</li>
							{/each}
						</ul>

						<Button href="/registro" size="lg" class="mt-8 h-12 px-7 text-base">
							Empieza gratis
							<ArrowRight class="size-4" />
						</Button>
					</div>

					<div class="relative sm:pb-10" data-reveal>
						<img
							src={FOTO_EMPRENDEDORA.src}
							srcset={FOTO_EMPRENDEDORA.srcset}
							sizes="(min-width: 768px) 28rem, 90vw"
							width={FOTO_EMPRENDEDORA.width}
							height={FOTO_EMPRENDEDORA.height}
							alt={FOTO_EMPRENDEDORA.alt}
							loading="lazy"
							decoding="async"
							class="aspect-[4/5] w-full rounded-lg object-cover sm:ml-auto sm:w-10/12"
						/>
						<div
							class="marketing-light relative z-10 mx-4 -mt-16 sm:absolute sm:bottom-0 sm:left-0 sm:mx-0 sm:mt-0 sm:w-72"
						>
							<OrderCard />
						</div>
					</div>
				</div>
			</section>

			<!-- Para quién es: tres rubros, y la ficha cambia con cada uno. -->
			<section id="que-vendes" class="py-16 md:py-24">
				<div class="mx-auto max-w-6xl px-4 sm:px-6">
					<div
						class="bg-secondary grid gap-1 rounded-lg p-1 sm:grid-cols-3"
						role="tablist"
						data-reveal
					>
						{#each rubros as item, indice (item.id)}
							<button
								type="button"
								role="tab"
								aria-selected={indice === rubroActivo}
								aria-controls="rubro-panel"
								onclick={() => (rubroActivo = indice)}
								class={cn(
									'flex items-center gap-3 rounded-[calc(var(--radius)-4px)] px-4 py-3 text-left text-sm font-medium transition-colors',
									indice === rubroActivo
										? 'bg-background text-foreground shadow-sm'
										: 'text-muted-foreground hover:bg-background/60'
								)}
							>
								<item.icono class="size-5 flex-none" aria-hidden="true" />
								{item.nombre}
							</button>
						{/each}
					</div>

					<div
						id="rubro-panel"
						role="tabpanel"
						class="mt-10 grid gap-10 md:grid-cols-[1fr_1.4fr] md:items-center"
					>
						{#key rubro.id}
							<div class="fade-up">
								<SectionTag label={rubro.eje} />
								<h2 class="mt-3 text-3xl md:text-4xl">{rubro.titulo}</h2>
								<p class="text-muted-foreground mt-4 text-lg text-pretty">{rubro.detalle}</p>
								<Button href="/registro" size="lg" class="mt-8 h-12 px-7 text-base">
									Empieza gratis
									<ArrowRight class="size-4" />
								</Button>
							</div>
						{/key}

						<!-- Detrás de la ficha, el lugar donde se vende eso: las tres fotos
						     están montadas y se cruzan al cambiar de pestaña, así no hay
						     un hueco mientras carga la siguiente. -->
						<div
							class="bg-secondary relative isolate flex items-center justify-center overflow-hidden rounded-lg p-6 md:min-h-[460px] md:p-10"
						>
							{#each rubros as item, indice (item.id)}
								<img
									src={FOTO_RUBRO[item.id].src}
									srcset={FOTO_RUBRO[item.id].srcset}
									sizes="(min-width: 768px) 36rem, 100vw"
									width={FOTO_RUBRO[item.id].width}
									height={FOTO_RUBRO[item.id].height}
									alt={FOTO_RUBRO[item.id].alt}
									loading="lazy"
									decoding="async"
									class={cn(
										'absolute inset-0 -z-10 size-full object-cover transition-opacity duration-500',
										indice === rubroActivo ? 'opacity-100' : 'opacity-0'
									)}
								/>
							{/each}
							<div class="bg-foreground/20 absolute inset-0 -z-10" aria-hidden="true"></div>

							{#key rubro.id}
								<VariantDemo rubro={rubro.id} class="fade-up" />
							{/key}
						</div>
					</div>
				</div>
			</section>

			<!-- Precios sobre lino: los tres planes, del panel. -->
			<section id="precios" class="bg-secondary py-16 md:py-24">
				<div class="mx-auto max-w-6xl px-4 sm:px-6" data-reveal>
					<div class="mx-auto mb-12 max-w-2xl text-center">
						<div class="flex justify-center"><SectionTag label="Precios" /></div>
						<h2 class="mt-3 text-3xl md:text-5xl">Una mensualidad, sin comisión por venta</h2>
						<p class="text-muted-foreground mx-auto mt-4 max-w-lg text-lg text-pretty">
							Empiezas con {TRIAL_DAYS} días gratis. Lo que vendas es tuyo.
						</p>
					</div>

					{#if data.plans.length === 0}
						<p
							class="text-muted-foreground border-border bg-background rounded-lg border border-dashed px-6 py-12 text-center"
						>
							No pudimos cargar los precios. Escríbenos y te los contamos.
						</p>
					{:else}
						<div class="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
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

			<!-- Lo que no cambia con el plan: tres garantías y la franja. -->
			<section class="py-16 md:py-24">
				<div class="mx-auto max-w-6xl px-4 sm:px-6">
					<div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between" data-reveal>
						<div class="max-w-2xl">
							<SectionTag label="Sin letra pequeña" />
							<h2 class="mt-3 text-3xl md:text-5xl">Lo que no cambia con el plan</h2>
						</div>
						<Button href="/registro" size="lg" class="h-12 px-7 text-base">
							Empieza gratis
							<ArrowRight class="size-4" />
						</Button>
					</div>

					<ul class="mt-10 grid gap-4 md:grid-cols-3" data-reveal-group>
						{#each garantias as garantia (garantia.titulo)}
							<li class="bg-secondary flex flex-col justify-between gap-16 rounded-lg p-7">
								<h3 class="max-w-[12ch] text-xl md:text-2xl">{garantia.titulo}</h3>
								<p class="text-muted-foreground text-pretty">{garantia.detalle}</p>
							</li>
						{/each}
					</ul>

					<div
						class="bg-primary text-primary-foreground mt-4 flex flex-col items-center justify-between gap-4 rounded-lg px-7 py-6 md:flex-row"
						data-reveal
					>
						<p class="text-center text-lg font-medium md:text-left">
							{TRIAL_DAYS} días gratis y cancelas cuando quieras. Tu tienda queda lista hoy mismo.
						</p>
						<Button
							href="/registro"
							size="lg"
							class="bg-background text-foreground hover:bg-background/90 h-12 flex-none px-7 text-base"
						>
							Empieza gratis
							<ArrowRight class="size-4" />
						</Button>
					</div>
				</div>
			</section>

			<!-- Preguntas: el titular a la izquierda, el acordeón a la derecha. -->
			<section id="preguntas" class="py-16 md:py-24">
				<div class="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 md:grid-cols-[1fr_1.4fr]">
					<div data-reveal>
						<SectionTag label="Preguntas" />
						<h2 class="mt-3 text-3xl md:text-5xl">Lo que nos preguntan siempre</h2>
						<p class="text-muted-foreground mt-4 text-lg text-pretty">
							¿Te queda alguna? Escríbenos antes de crear la tienda.
						</p>
						<Button href="/contacto" variant="outline" size="lg" class="mt-8 h-12 px-7 text-base">
							Escríbenos
						</Button>
					</div>

					<Accordion.Root type="single" class="border-border border-t" data-reveal>
						{#each preguntas as item (item.pregunta)}
							<Accordion.Item value={item.pregunta}>
								<Accordion.Trigger class="py-5 text-base font-medium hover:no-underline">
									{item.pregunta}
								</Accordion.Trigger>
								<Accordion.Content class="text-muted-foreground pb-5 text-base text-pretty">
									{item.respuesta}
								</Accordion.Content>
							</Accordion.Item>
						{/each}
					</Accordion.Root>
				</div>
			</section>

			<!-- Cierre en pizarra: el mismo golpe de contraste con el que abre, sobre
			     la clienta que compra a las once de la noche. La foto se apaga
			     hacia la izquierda, donde va el texto, y se funde abajo con el pie. -->
			<section
				class="marketing-dark bg-background text-foreground relative isolate overflow-hidden py-24 md:py-36"
			>
				<img
					src={FOTO_CLIENTA_NOCHE.src}
					srcset={FOTO_CLIENTA_NOCHE.srcset}
					sizes="100vw"
					width={FOTO_CLIENTA_NOCHE.width}
					height={FOTO_CLIENTA_NOCHE.height}
					alt={FOTO_CLIENTA_NOCHE.alt}
					loading="lazy"
					decoding="async"
					class="absolute inset-0 -z-10 size-full object-cover object-[70%_center]"
				/>
				<div
					class="bg-background/80 md:from-background md:via-background/85 absolute inset-0 -z-10 md:bg-transparent md:bg-linear-to-r md:to-transparent"
					aria-hidden="true"
				></div>
				<div
					class="from-background absolute inset-x-0 bottom-0 -z-10 h-24 bg-linear-to-t"
					aria-hidden="true"
				></div>

				<div class="mx-auto max-w-6xl px-4 sm:px-6" data-reveal>
					<div class="max-w-xl">
						<h2 class="text-4xl text-balance md:text-6xl">Abre tu tienda hoy</h2>
						<p class="text-muted-foreground mt-5 text-lg text-pretty md:text-xl">
							Nadie compra a las once de la noche si tiene que esperar tu respuesta.
						</p>
						<div class="mt-8">
							<Button href="/registro" size="lg" class="h-12 px-7 text-base">
								Empieza gratis
								<ArrowRight class="size-4" />
							</Button>
						</div>
					</div>
				</div>
			</section>
		</main>

		<MarketingFooter />
	</SmoothScroll>
</div>
