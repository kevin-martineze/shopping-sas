<script lang="ts">
	import { onMount } from 'svelte';

	import Check from '@lucide/svelte/icons/check';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import ShoppingBag from '@lucide/svelte/icons/shopping-bag';

	import { Button } from '$lib/components/atoms/button';
	import GloberceMark from '$lib/components/molecules/GloberceMark.svelte';
	import { FOTO_PRODUCTO, FOTO_RUBRO } from '$lib/config/fotos';
	import { HOST_MAQUETA, TIENDA_MAQUETA } from '$lib/config/maqueta';
	import { cn } from '$lib/utils';
	import { formatMoney } from '$lib/utils/money';

	/**
	 * El comercial de la portada: una tienda que sale del celular.
	 *
	 * No es un video: es HTML animado con GSAP, en bucle. Así pesa casi nada,
	 * se ve nítido en cualquier pantalla y los textos se cambian aquí mismo.
	 * La historia, en ocho escenas: la marca; a una clienta le comparten la
	 * tienda por chat; el catálogo sale del celular; elige talla y color y
	 * paga; a la dueña le llega el pedido pagado; tiendas de otros rubros; la
	 * promesa; y el cierre con la marca.
	 *
	 * Ocupa toda la primera pantalla. El fondo —pizarra y luz— llena el
	 * marco de borde a borde; las escenas van en un escenario de tamaño fijo
	 * —1280 × 720 en pantallas anchas, 540 × 880 en el celular— que se escala
	 * para caber entero debajo de la cabecera. Así cada escena se compone una
	 * vez, en píxeles, y no se descuadra en ninguna pantalla.
	 *
	 * Cómo se reproduce:
	 * - Arranca solo al entrar, para todos, y da `VUELTAS` vueltas. Después se
	 *   queda en el cierre —la marca sobre la luz—, que hace de banner.
	 * - El botón de la esquina pausa mientras corre (más de 5 s de movimiento
	 *   automático lo exigen) y, ya en el banner, lo pasa una vez más.
	 * - Sin JavaScript, o antes de que cargue GSAP, se ve ese mismo banner.
	 * - Fuera de la pantalla se pausa solo: no gasta batería a nadie.
	 *
	 * Decorativo para lectores de pantalla: lo que cuenta ya lo dice el texto
	 * de la portada, justo debajo.
	 */

	interface Props {
		/** El ancla de lo que sigue: la flecha de abajo lleva allí. */
		siguiente: string;
	}

	let { siguiente }: Props = $props();

	const DOMINIO = HOST_MAQUETA.slice(TIENDA_MAQUETA.slug.length + 1);

	/** Tamaños del escenario, iguales a los del CSS de abajo. */
	const ESCENARIO = {
		horizontal: { ancho: 1280, alto: 720 },
		vertical: { ancho: 540, alto: 880 }
	};
	/** Lo que tapa la cabecera fija: el escenario se centra debajo. */
	const CABECERA = 64;
	/** Más grande que esto, las fotos se empiezan a ver blandas. */
	const ESCALA_MAXIMA = 1.25;
	const VERTICAL = '(max-width: 639px)';

	const catalogo = [
		{
			nombre: 'Blusa Vera',
			precio: 89900,
			foto: FOTO_PRODUCTO.ropa.src,
			zoom: '180%',
			foco: 'center'
		},
		{
			nombre: 'Vestido Lino',
			precio: 159900,
			foto: FOTO_RUBRO.ropa.src,
			zoom: '300%',
			foco: '42% 30%'
		},
		{
			nombre: 'Camisa Salvia',
			precio: 94900,
			foto: FOTO_RUBRO.ropa.src,
			zoom: '320%',
			foco: '62% 34%'
		},
		{
			nombre: 'Sandalias Cuero',
			precio: 139900,
			foto: FOTO_RUBRO.ropa.src,
			zoom: '360%',
			foco: '58% 88%'
		}
	];

	const tallas = ['S', 'M', 'L', 'XL'];

	/** Colores de la prenda, no de la marca: no cambian con el tema. */
	const colores = [
		{ nombre: 'Verde', valor: '#8c9a78' },
		{ nombre: 'Crema', valor: '#e8dfcc' },
		{ nombre: 'Terracota', valor: '#b4643c' }
	];

	const tiendas = [
		{ iniciales: 'CO', nombre: TIENDA_MAQUETA.nombre, host: HOST_MAQUETA, foto: FOTO_RUBRO.ropa },
		{
			iniciales: 'TL',
			nombre: 'Tostadero Ladera',
			host: `ladera.${DOMINIO}`,
			foto: FOTO_RUBRO.cafe
		},
		{
			iniciales: 'LP',
			nombre: 'Librería Páramo',
			host: `paramo.${DOMINIO}`,
			foto: FOTO_RUBRO.unico
		}
	];

	const productos = [
		{ nombre: 'Blusa Vera', precio: 89900, foto: FOTO_PRODUCTO.ropa },
		{ nombre: 'Café de origen 500 g', precio: 42000, foto: FOTO_PRODUCTO.cafe },
		{ nombre: 'Cuaderno de viaje', precio: 58000, foto: FOTO_PRODUCTO.unico }
	];

	/** Los números cuadran con `OrderCard`: $89.900 más $12.000 de envío. */
	const ENVIO = 12000;
	const TOTAL = 89900 + ENVIO;

	const promesa = [
		{ palabra: 'Que', resaltada: false, salto: false },
		{ palabra: 'te', resaltada: false, salto: false },
		{ palabra: 'compren', resaltada: false, salto: true },
		{ palabra: 'sin', resaltada: true, salto: false },
		{ palabra: 'esperar', resaltada: true, salto: false },
		{ palabra: 'tu', resaltada: false, salto: false },
		{ palabra: 'respuesta', resaltada: false, salto: false }
	];

	let marco = $state<HTMLDivElement>();
	let escenario = $state<HTMLDivElement>();
	let escala = $state<number | null>(null);
	let pausaManual = $state(false);
	let terminado = $state(false);
	let total = $state(formatMoney(TOTAL));

	/** Vueltas que da solo al entrar; las demás, a pedido. */
	const VUELTAS = 2;
	/** El segundo del guion en que el cierre ya está armado: el banner. */
	const BANNER = 27;

	let vueltas = 0;
	let limite = VUELTAS;
	let visible = true;

	/** Lo que el escenario sabe hacer, una vez armado. */
	let aplicar = () => {};
	let reiniciar = () => {};

	function alBoton() {
		if (terminado) {
			// Ya en el banner: una vuelta más, desde el principio.
			limite = vueltas + 1;
			terminado = false;
			pausaManual = false;
			reiniciar();
			return;
		}

		pausaManual = !pausaManual;
		aplicar();
	}

	onMount(() => {
		if (!marco || !escenario) return;

		const raizMarco = marco;
		const raiz = escenario;

		const medir = () => {
			const vertical = window.matchMedia(VERTICAL).matches;
			const { ancho, alto } = vertical ? ESCENARIO.vertical : ESCENARIO.horizontal;
			escala = Math.min(
				raizMarco.clientWidth / ancho,
				(raizMarco.clientHeight - CABECERA) / alto,
				ESCALA_MAXIMA
			);
		};
		const observador = new ResizeObserver(medir);
		observador.observe(raizMarco);
		medir();

		let cancelado = false;
		let limpiar = () => {};

		void (async () => {
			const { gsap } = await import('gsap');

			if (cancelado) return;

			const medios = gsap.matchMedia(raizMarco);

			// Se arma de nuevo si se cruza el corte entre horizontal y vertical:
			// las escenas cambian de composición y las distancias, de escala.
			medios.add({ vertical: VERTICAL, horizontal: '(min-width: 640px)' }, (contexto) => {
				const vertical = contexto.conditions?.vertical === true;
				/** Desplazamientos de la luz: en vertical hay menos ancho. */
				const k = vertical ? 0.45 : 1;
				const TEAL = getComputedStyle(raiz).getPropertyValue('--primary').trim();
				const SOBRE_TEAL = getComputedStyle(raiz).getPropertyValue('--primary-foreground').trim();

				// El CSS centra con `translate(-50%, -50%)` para el cuadro sin JavaScript;
				// GSAP lo lleva en porcentajes propios y deja `x`/`y` libres.
				gsap.set('.capa, .leyenda', { xPercent: -50, yPercent: -50, x: 0, y: 0 });
				gsap.set('.celular', { transformOrigin: '50% 52%' });
				gsap.set('.pagado', { autoAlpha: 0, y: 20 });

				// La luz respira aparte del guion: sigue viva sobre el banner.
				const respiro = gsap.to('.luz-aire', {
					scale: 1.08,
					duration: 3.2,
					yoyo: true,
					repeat: -1,
					ease: 'sine.inOut'
				});

				const tl = gsap.timeline({
					repeat: -1,
					repeatDelay: 0.4,
					defaults: { ease: 'power3.out' }
				});

				const toque = (sel: string, en: number) =>
					tl
						.fromTo(
							sel,
							{ opacity: 0, scale: 0.3 },
							{ opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' },
							en
						)
						.to(sel, { opacity: 0, scale: 1.7, duration: 0.45, ease: 'power2.out' }, en + 0.25);

				// El cierre arranca visible (es el cartel sin JavaScript): se
				// esconde antes de que empiece la primera escena.
				tl.set('.cierre', { autoAlpha: 0 }, 0);

				// 1. Marca
				tl.fromTo(
					'.luz',
					{ autoAlpha: 0, scale: 0.3 },
					{ autoAlpha: 1, scale: 1, duration: 1.6, ease: 'power2.out' },
					0
				)
					.fromTo(
						'.marca',
						{ autoAlpha: 0, scale: 0.86, filter: 'blur(14px)' },
						{ autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 1.2 },
						0.3
					)
					.to(
						'.marca',
						{ autoAlpha: 0, scale: 1.08, filter: 'blur(10px)', duration: 0.6, ease: 'power2.in' },
						2.1
					);

				// 2. Le comparten la tienda por chat
				tl.fromTo(
					'.celular',
					{ autoAlpha: 0, y: 460, rotationX: 38, rotationZ: -9, scale: 0.9 },
					{ autoAlpha: 1, y: 0, rotationX: 14, rotationZ: -3, scale: 1, duration: 1.4 },
					2.6
				)
					.to('.luz', { x: -60 * k, y: 60, scale: 0.85, duration: 1.4 }, 2.6)
					.fromTo(
						'.celular .msg',
						{ autoAlpha: 0, y: 18 },
						{ autoAlpha: 1, y: 0, stagger: 0.4, duration: 0.5 },
						3.2
					)
					.to('.celular', { rotationX: 4, rotationZ: 0, duration: 2.2, ease: 'sine.inOut' }, 4)
					.to(
						'.enlace',
						{ scale: 0.96, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' },
						5.3
					);
				toque('.toque-enlace', 5.25);
				tl.to(
					'.celular',
					{
						scale: 3.6,
						y: -40,
						autoAlpha: 0,
						filter: 'blur(8px)',
						duration: 1,
						ease: 'power3.in'
					},
					5.8
				)
					.to('.luz', { x: 0, y: 0, scale: 1.45, duration: 0.7, ease: 'power2.in' }, 5.9)
					.fromTo(
						'.destello',
						{ opacity: 0 },
						{ opacity: 1, duration: 0.35, yoyo: true, repeat: 1, ease: 'power1.inOut' },
						6.3
					)
					.to('.luz', { scale: 1, duration: 1.2 }, 6.7);

				// 3. La tienda sale del celular
				tl.fromTo(
					'.catalogo',
					{ autoAlpha: 0, rotationX: 40, rotationY: -16, rotationZ: 6, z: -320 },
					{ autoAlpha: 1, rotationX: 24, rotationY: -7, rotationZ: 3, z: 0, duration: 1.3 },
					6.6
				)
					.fromTo(
						'.catalogo .barra, .catalogo .chip',
						{ autoAlpha: 0, y: -24 },
						{ autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.5 },
						6.8
					)
					.fromTo(
						'.catalogo .fila',
						{ autoAlpha: 0, z: -280, y: 50 },
						{ autoAlpha: 1, z: 0, y: 0, stagger: 0.13, duration: 0.8 },
						7
					)
					.to('.chip-blusas', { backgroundColor: TEAL, color: SOBRE_TEAL, duration: 0.3 }, 8)
					.to(
						'.catalogo',
						{ rotationX: 12, rotationY: 9, rotationZ: -2, duration: 3, ease: 'sine.inOut' },
						7.9
					)
					.to('.luz', { x: 80 * k, y: -30, duration: 3, ease: 'sine.inOut' }, 7.9)
					.to(
						'.fila-elegida',
						{
							scale: 1.07,
							z: 70,
							boxShadow: `0 0 0 2px ${TEAL}, 0 30px 80px rgb(0 0 0 / 50%)`,
							duration: 0.5
						},
						9.5
					)
					.to(
						'.catalogo .fila:not(.fila-elegida), .catalogo .chips, .catalogo .barra',
						{ autoAlpha: 0, z: -200, duration: 0.5, ease: 'power2.in' },
						10
					)
					.to('.catalogo', { autoAlpha: 0, z: 260, duration: 0.5, ease: 'power2.in' }, 10.2);

				// 4. Elige talla y color, y paga
				tl.fromTo(
					'.ficha',
					{ autoAlpha: 0, rotationY: -26, rotationX: 10, z: -240, x: 80 * k },
					{ autoAlpha: 1, rotationY: -9, rotationX: 5, z: 0, x: 0, duration: 1.1 },
					10.5
				)
					.to('.luz', { x: -120 * k, y: 20, scale: 1.1, duration: 1.4 }, 10.5)
					.fromTo(
						'.ficha-info > *',
						{ autoAlpha: 0, y: 16 },
						{ autoAlpha: 1, y: 0, stagger: 0.07, duration: 0.5 },
						10.9
					)
					.to('.ficha', { rotationY: 7, rotationX: 2, duration: 3.6, ease: 'sine.inOut' }, 11.3)
					.to(
						'.talla-elegida',
						{ backgroundColor: TEAL, color: SOBRE_TEAL, borderColor: TEAL, duration: 0.25 },
						12.05
					);
				toque('.toque-talla', 12);
				toque('.toque-color', 12.6);
				tl.fromTo(
					'.color-elegido',
					{ opacity: 0, scale: 0.6 },
					{ opacity: 1, scale: 1, duration: 0.3 },
					12.65
				).fromTo('.quedan', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 12.9);
				toque('.toque-pagar', 13.5);
				tl.to('.pagar', { scale: 0.97, duration: 0.12, yoyo: true, repeat: 1 }, 13.5)
					.to('.comprar', { autoAlpha: 0, y: -20, duration: 0.3 }, 13.75)
					.fromTo('.pagado', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.35 }, 13.85)
					.to('.ficha', { autoAlpha: 0, z: -180, duration: 0.5, ease: 'power2.in' }, 14.5);

				// 5. A la dueña le llega el pedido pagado
				const cuenta = { v: 0 };
				tl.fromTo(
					'.destello',
					{ opacity: 0 },
					{ opacity: 0.7, duration: 0.3, yoyo: true, repeat: 1 },
					14.75
				)
					.to('.luz', { x: 0, y: -20, scale: 1.25, duration: 0.9 }, 14.7)
					.fromTo(
						'.pedido',
						{ autoAlpha: 0, y: -200, rotationX: -45, scale: 0.88 },
						{
							autoAlpha: 1,
							y: -30,
							rotationX: 10,
							scale: 1,
							duration: 1.1,
							ease: 'back.out(1.5)'
						},
						14.8
					)
					.fromTo(
						'.pedido .linea',
						{ autoAlpha: 0, x: -12 },
						{ autoAlpha: 1, x: 0, stagger: 0.12, duration: 0.4 },
						15.2
					)
					.fromTo(
						cuenta,
						{ v: 0 },
						{
							v: TOTAL,
							duration: 1,
							ease: 'power2.out',
							onUpdate: () => {
								total = formatMoney(Math.round(cuenta.v / 100) * 100);
							}
						},
						15.7
					)
					.fromTo(
						'.leyenda',
						{ autoAlpha: 0, y: vertical ? 270 : 220 },
						{ autoAlpha: 1, y: vertical ? 250 : 200, duration: 0.6 },
						16.1
					)
					.to('.pedido', { rotationX: 0, rotationY: 6, duration: 1.6, ease: 'sine.inOut' }, 15.9)
					.to(
						'.pedido, .leyenda',
						{ autoAlpha: 0, scale: 0.94, duration: 0.5, ease: 'power2.in' },
						17.4
					);

				// 6. Sirve para lo que vendas: la cámara baja por la rejilla
				const rejilla = raiz.querySelector<HTMLElement>('.tiendas');
				const sobra = Math.max(0, ((rejilla?.offsetHeight ?? 0) - raiz.offsetHeight) / 2);
				const viaje = sobra + (vertical ? 120 : 170);
				tl.fromTo(
					'.tiendas',
					{ autoAlpha: 0, rotationX: 30, y: viaje + 130, z: -200 },
					{ autoAlpha: 1, rotationX: 20, y: viaje, z: 0, duration: 1 },
					17.9
				)
					.fromTo(
						'.tiendas .tarjeta',
						{ autoAlpha: 0, z: -260 },
						{ autoAlpha: 1, z: 0, stagger: 0.1, duration: 0.7 },
						18.1
					)
					.to('.tiendas', { y: -viaje, rotationX: 14, duration: 3.2, ease: 'sine.inOut' }, 18.6)
					.to('.luz', { x: 140 * k, y: 40, scale: 1, duration: 3.2, ease: 'sine.inOut' }, 18.3)
					.to('.tiendas', { autoAlpha: 0, z: -220, duration: 0.5, ease: 'power2.in' }, 21.4);

				// 7. La promesa
				tl.to('.luz', { x: -330 * k, y: vertical ? 260 : 170, scale: 0.85, duration: 1.2 }, 21.6)
					.set('.promesa', { autoAlpha: 1 }, 21.9)
					.fromTo(
						'.promesa .palabra',
						{ autoAlpha: 0, y: 30, filter: 'blur(10px)' },
						{ autoAlpha: 1, y: 0, filter: 'blur(0px)', stagger: 0.14, duration: 0.6 },
						21.9
					)
					.to(
						'.promesa',
						{ autoAlpha: 0, filter: 'blur(8px)', duration: 0.5, ease: 'power2.in' },
						24.6
					);

				// 8. Cierre
				tl.to('.luz', { x: 0, y: 0, scale: 1.05, duration: 1.2 }, 24.8)
					.fromTo(
						'.cierre',
						{ autoAlpha: 0, scale: 0.9, filter: 'blur(12px)' },
						{ autoAlpha: 1, scale: 1, filter: 'blur(0px)', duration: 1 },
						25.1
					)
					.fromTo('.cierre > *', { y: 20 }, { y: 0, stagger: 0.12, duration: 0.7 }, 25.1)
					.to('.cierre, .luz', { autoAlpha: 0, duration: 0.7, ease: 'power2.in' }, 28.3);

				// Cada vuelta pasa por el banner: ahí se cuenta, y en la última
				// se queda. El fundido de después solo lo ve quien repite.
				tl.call(
					() => {
						vueltas += 1;
						if (vueltas < limite) return;
						tl.pause();
						terminado = true;
					},
					[],
					BANNER
				);

				aplicar = () => {
					tl.paused(pausaManual || terminado || !visible);
					respiro.paused(!visible);
				};

				reiniciar = () => {
					tl.restart();
					aplicar();
				};

				// Si se rearma tras cruzar el corte, sigue donde iba: en el
				// banner si ya terminó.
				if (terminado) tl.pause(BANNER);
				aplicar();
			});

			// Fuera de la pantalla no se mueve: ni batería ni procesador.
			const vigia = new IntersectionObserver(([entrada]) => {
				visible = entrada?.isIntersecting ?? true;
				aplicar();
			});
			vigia.observe(raizMarco);

			limpiar = () => {
				vigia.disconnect();
				medios.revert();
			};
		})();

		return () => {
			cancelado = true;
			observador.disconnect();
			limpiar();
		};
	});
</script>

<div bind:this={marco} class="marco relative">
	<div
		bind:this={escenario}
		class="escenario"
		style:--escala={escala ?? undefined}
		aria-hidden="true"
	>
		<div class="luz-aire"><div class="luz"></div></div>

		<!-- 1. Marca -->
		<div class="capa marca">
			<GloberceMark size={96} label="" class="marca-logo" />
			<span>Globerce</span>
		</div>

		<!-- 2. Le comparten la tienda por chat -->
		<div class="capa celular">
			<div class="pantalla">
				<div class="estado"><span>23:39</span><span>5G</span></div>
				<div class="chat-cabeza">
					<div class="avatar">VA</div>
					<div><b>Valentina</b><small>en línea</small></div>
				</div>
				<div class="chat">
					<div class="msg">¿Ya viste la colección nueva de {TIENDA_MAQUETA.nombre}?</div>
					<div class="msg enlace">
						<img src={FOTO_RUBRO.ropa.src} alt="" width="512" height="512" />
						<div class="enlace-texto">
							<b>{TIENDA_MAQUETA.nombre}</b>
							<small>Ropa en lino, hecha en Medellín</small>
							<span>{HOST_MAQUETA}</span>
						</div>
						<i class="toque toque-enlace"></i>
					</div>
					<div class="msg propio">Ya mismo la miro</div>
				</div>
				<div class="escribir">Escribe un mensaje</div>
			</div>
		</div>

		<!-- 3. La tienda sale del celular -->
		<div class="capa catalogo">
			<div class="barra">
				<b>{TIENDA_MAQUETA.nombre}</b>
				<ShoppingBag class="size-7" />
			</div>
			<div class="chips">
				<span class="chip">Todo</span>
				<span class="chip chip-blusas">Blusas</span>
				<span class="chip">Vestidos</span>
				<span class="chip">Accesorios</span>
			</div>
			<div class="filas">
				{#each catalogo as item, indice (item.nombre)}
					<div class={cn('fila', indice === 0 && 'fila-elegida')}>
						<div
							class="miniatura"
							style:background-image="url({item.foto})"
							style:background-size={item.zoom}
							style:background-position={item.foco}
						></div>
						<div>
							<b>{item.nombre}</b>
							<small>{formatMoney(item.precio)}</small>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- 4. Elige talla y color, y paga -->
		<div class="capa ficha">
			<img
				src={FOTO_PRODUCTO.ropa.src}
				srcset={FOTO_PRODUCTO.ropa.srcset}
				sizes="440px"
				alt=""
				width={FOTO_PRODUCTO.ropa.width}
				height={FOTO_PRODUCTO.ropa.height}
			/>
			<div class="ficha-info">
				<div class="miga">Tienda / Blusas</div>
				<div class="ficha-nombre">Blusa Vera</div>
				<div class="ficha-precio">{formatMoney(89900)}</div>
				<div>
					<div class="rotulo">Talla</div>
					<div class="tallas">
						{#each tallas as talla (talla)}
							<span class={cn('talla', talla === 'M' && 'talla-elegida')}>
								{talla}
								{#if talla === 'M'}<i class="toque toque-talla"></i>{/if}
							</span>
						{/each}
					</div>
				</div>
				<div>
					<div class="rotulo">Color</div>
					<div class="colores">
						{#each colores as color, indice (color.nombre)}
							<span class="color" style:background-color={color.valor}>
								{#if indice === 0}
									<i class="color-elegido"></i>
									<i class="toque toque-color"></i>
								{/if}
							</span>
						{/each}
					</div>
				</div>
				<div class="quedan">Quedan 3 en talla M, verde</div>
				<div class="pagar">
					<span class="comprar"><ShoppingBag class="size-5" />Comprar · {formatMoney(89900)}</span>
					<span class="pagado"><Check class="size-5" />Pagado con tarjeta</span>
					<i class="toque toque-pagar"></i>
				</div>
			</div>
		</div>

		<!-- 5. A la dueña le llega el pedido pagado -->
		<div class="capa pedido marketing-light">
			<div class="linea pedido-cabeza">
				<span class="punto"></span><b>Pedido nuevo</b><span>23:41</span>
			</div>
			<p class="linea mt-3.5">Blusa Vera · talla M · verde ×1</p>
			<p class="linea apagado">Envío Medellín · {formatMoney(ENVIO)}</p>
			<p class="linea cobrado">Pagado en línea · Tarjeta</p>
			<div class="linea pedido-total"><span>Total</span><strong>{total}</strong></div>
		</div>
		<div class="leyenda">Te compraron a las 23:41. <em>Sin escribirte.</em></div>

		<!-- 6. Sirve para lo que vendas -->
		<div class="capa tiendas">
			<div class="tiendas-titulo">Tiendas hechas con Globerce</div>
			<div class="chips">
				<span class="chip chip-activo">Todas</span>
				<span class="chip">Ropa</span>
				<span class="chip">Café</span>
				<span class="chip">Libros</span>
			</div>
			<div class="rejilla">
				{#each tiendas as tienda (tienda.host)}
					<div class="tarjeta">
						<div class="tarjeta-meta">
							<i>{tienda.iniciales}</i>
							<div><b>{tienda.nombre}</b><small>{tienda.host}</small></div>
						</div>
						<img
							src={tienda.foto.src}
							alt=""
							width={tienda.foto.width}
							height={tienda.foto.height}
						/>
					</div>
				{/each}
				{#each productos as producto (producto.nombre)}
					<div class="tarjeta">
						<img
							src={producto.foto.src}
							alt=""
							width={producto.foto.width}
							height={producto.foto.height}
						/>
						<div class="tarjeta-precio">
							<span>{producto.nombre}</span><span>{formatMoney(producto.precio)}</span>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- 7. La promesa -->
		<div class="capa promesa">
			{#each promesa as item (item.palabra)}
				<span class={cn('palabra', item.resaltada && 'resaltada')}>{item.palabra}</span>
				{#if item.salto}<br />{/if}
			{/each}
		</div>

		<!-- 8. Cierre: también es lo que se ve sin JavaScript -->
		<div class="capa cierre">
			<div class="marca-fila">
				<GloberceMark size={96} label="" class="marca-logo" />
				<span>Globerce</span>
			</div>
			<p>Tu tienda online en minutos</p>
		</div>
	</div>

	<div class="destello"></div>
	<div class="sombra"></div>

	<a href="#{siguiente}" class="seguir float" aria-label="Ver cómo funciona">
		<ChevronDown class="size-6" />
	</a>

	<Button
		type="button"
		variant="secondary"
		size="icon"
		class="absolute right-4 bottom-4 z-10 opacity-80 hover:opacity-100 md:right-6 md:bottom-6"
		aria-label={terminado
			? 'Ver la animación de nuevo'
			: pausaManual
				? 'Reproducir la animación'
				: 'Pausar la animación'}
		onclick={alBoton}
	>
		{#if terminado}<RotateCcw />{:else if pausaManual}<Play />{:else}<Pause />{/if}
	</Button>
</div>

<style>
	/*
	 * El marco es la primera pantalla entera: pinta la pizarra y la sombra de
	 * los bordes, y recorta. El escenario mide siempre lo mismo y se escala
	 * con `--escala`, que calcula el componente; centrado debajo de la
	 * cabecera. El valor por defecto es el de una pantalla de portátil, para
	 * que el primer cuadro —antes de medir— ya caiga casi en su sitio.
	 *
	 * Los colores salen de los tokens de `.marketing-dark`; los pocos fijos
	 * son de objetos (el cuerpo del celular, la tela), no de la marca.
	 */
	.marco {
		--noche: color-mix(in oklab, var(--background) 55%, black);
		--ficha-2: color-mix(in oklab, var(--card) 85%, white 6%);
		--teal-hondo: color-mix(in oklab, var(--primary) 55%, var(--background));
		--cabecera: 64px;

		position: relative;
		height: 100svh;
		min-height: 560px;
		overflow: hidden;
		background: radial-gradient(ellipse 70% 70% at 50% 55%, var(--background) 0%, var(--noche) 80%);
		color: var(--foreground);
	}

	.escenario {
		position: absolute;
		top: calc(50% + var(--cabecera) / 2);
		left: 50%;
		width: 1280px;
		height: 720px;
		transform: translate(-50%, -50%) scale(var(--escala, 1));
		perspective: 1600px;
		perspective-origin: 50% 45%;
		user-select: none;
	}

	.seguir {
		position: absolute;
		bottom: 1.25rem;
		left: 50%;
		z-index: 10;
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		margin-left: -1.375rem;
		border-radius: 999px;
		color: var(--muted-foreground);
		transition: color 0.2s;
	}

	.seguir:hover {
		color: var(--foreground);
	}

	.seguir:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 2px;
	}

	.capa,
	.leyenda {
		position: absolute;
		top: 50%;
		left: 50%;
		visibility: hidden;
		transform: translate(-50%, -50%);
		transform-style: preserve-3d;
	}

	.cierre {
		visibility: visible;
	}

	.luz-aire {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
	}

	.luz {
		position: absolute;
		top: -400px;
		left: -400px;
		width: 800px;
		height: 800px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			color-mix(in oklab, var(--primary) 85%, white) 0%,
			color-mix(in oklab, var(--primary) 60%, transparent) 22%,
			color-mix(in oklab, var(--primary) 22%, transparent) 46%,
			transparent 68%
		);
		filter: blur(28px);
	}

	.destello,
	.sombra {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.destello {
		opacity: 0;
		background: radial-gradient(
			circle at 50% 50%,
			color-mix(in oklab, var(--primary) 55%, transparent),
			transparent 60%
		);
	}

	.sombra {
		background: radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgb(0 0 0 / 65%) 100%);
	}

	.toque {
		position: absolute;
		top: 50%;
		left: 50%;
		width: 90px;
		height: 90px;
		margin: -45px 0 0 -45px;
		border: 3px solid rgb(255 255 255 / 90%);
		border-radius: 50%;
		background: rgb(255 255 255 / 15%);
		opacity: 0;
		pointer-events: none;
	}

	/* Marca y cierre */
	.marca,
	.marca-fila {
		display: flex;
		align-items: center;
		gap: 22px;
	}

	.marca span,
	.marca-fila span {
		font-size: 76px;
		font-weight: 650;
		letter-spacing: -0.035em;
	}

	/* Centradas desde el medio, el ancho disponible sería la mitad: que
	   midan lo que su texto pida. */
	.marca,
	.cierre {
		width: max-content;
	}

	.cierre {
		display: grid;
		justify-items: center;
		gap: 18px;
		text-align: center;
	}

	.cierre p {
		color: var(--muted-foreground);
		font-size: 26px;
	}

	/* Celular */
	.celular {
		width: 300px;
		height: 620px;
		padding: 10px;
		border-radius: 48px;
		background: color-mix(in oklab, var(--background) 60%, black);
		box-shadow:
			inset 0 0 0 1.5px rgb(255 255 255 / 12%),
			0 50px 120px rgb(0 0 0 / 65%);
	}

	.pantalla {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
		border-radius: 38px;
		background: color-mix(in oklab, var(--background) 92%, white);
	}

	.estado {
		display: flex;
		justify-content: space-between;
		padding: 14px 24px 6px;
		font-size: 13px;
		font-weight: 600;
	}

	.chat-cabeza {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 14px 12px;
		border-bottom: 1px solid var(--border);
	}

	.chat-cabeza b {
		display: block;
		font-size: 15px;
	}

	.chat-cabeza small {
		color: var(--muted-foreground);
		font-size: 12px;
	}

	.avatar {
		display: grid;
		place-items: center;
		width: 34px;
		height: 34px;
		border-radius: 50%;
		background: var(--ficha-2);
		font-size: 13px;
		font-weight: 600;
	}

	.chat {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: flex-end;
		gap: 8px;
		padding: 12px;
	}

	.msg {
		max-width: 82%;
		padding: 9px 12px;
		border-radius: 4px 14px 14px;
		background: var(--ficha-2);
		font-size: 14px;
		line-height: 1.35;
	}

	.msg.propio {
		align-self: flex-end;
		border-radius: 14px 4px 14px 14px;
		background: var(--teal-hondo);
	}

	.enlace {
		position: relative;
		padding: 4px;
	}

	.enlace img {
		display: block;
		width: 100%;
		height: 128px;
		border-radius: 10px;
		object-fit: cover;
	}

	.enlace-texto {
		display: grid;
		gap: 2px;
		padding: 8px 8px 4px;
	}

	.enlace-texto b {
		font-size: 15px;
	}

	.enlace-texto small {
		color: var(--muted-foreground);
		font-size: 12px;
	}

	.enlace-texto span {
		margin-top: 4px;
		color: var(--primary);
		font-size: 12px;
		font-weight: 600;
	}

	.escribir {
		display: flex;
		align-items: center;
		height: 40px;
		margin: 0 12px 14px;
		padding: 0 16px;
		border-radius: 20px;
		background: var(--ficha-2);
		color: var(--muted-foreground);
		font-size: 13px;
	}

	/* Catálogo */
	.catalogo {
		width: 880px;
	}

	.barra {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 18px;
	}

	.barra b {
		font-size: 30px;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	.chips {
		display: flex;
		gap: 10px;
		margin-bottom: 20px;
	}

	.chip {
		padding: 9px 18px;
		border-radius: 999px;
		background: var(--ficha-2);
		font-size: 16px;
		font-weight: 600;
	}

	.chip-activo {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.filas {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.fila {
		display: flex;
		align-items: center;
		gap: 18px;
		height: 104px;
		overflow: hidden;
		border-radius: 12px;
		background: color-mix(in oklab, var(--ficha-2) 94%, transparent);
	}

	.miniatura {
		flex: none;
		width: 104px;
		height: 104px;
	}

	.fila b {
		display: block;
		font-size: 21px;
		font-weight: 650;
	}

	.fila small {
		display: block;
		margin-top: 4px;
		color: var(--muted-foreground);
		font-size: 17px;
		font-variant-numeric: tabular-nums;
	}

	/* Ficha */
	.ficha {
		display: flex;
		width: 940px;
		height: 480px;
		overflow: hidden;
		border-radius: 22px;
		background: var(--card);
		box-shadow: 0 50px 120px rgb(0 0 0 / 60%);
	}

	.ficha > img {
		width: 440px;
		height: 100%;
		object-fit: cover;
	}

	.ficha-info {
		display: flex;
		flex: 1;
		flex-direction: column;
		gap: 14px;
		padding: 36px 38px;
	}

	.miga {
		color: var(--muted-foreground);
		font-size: 15px;
	}

	.ficha-nombre {
		font-size: 44px;
		font-weight: 650;
		letter-spacing: -0.03em;
		line-height: 1.05;
	}

	.ficha-precio {
		font-size: 28px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.rotulo {
		margin-bottom: 8px;
		color: var(--muted-foreground);
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	.tallas,
	.colores {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.talla {
		position: relative;
		display: grid;
		place-items: center;
		width: 54px;
		height: 46px;
		border: 1.5px solid var(--border);
		border-radius: 10px;
		font-size: 17px;
		font-weight: 600;
	}

	.color {
		position: relative;
		width: 34px;
		height: 34px;
		border-radius: 50%;
	}

	.color-elegido {
		position: absolute;
		inset: -6px;
		border: 2.5px solid var(--primary);
		border-radius: 50%;
		opacity: 0;
	}

	.quedan {
		color: var(--primary);
		font-size: 15px;
		font-weight: 500;
	}

	.pagar {
		position: relative;
		display: grid;
		place-items: center;
		height: 58px;
		margin-top: auto;
		overflow: hidden;
		border-radius: 999px;
		background: var(--primary);
		color: var(--primary-foreground);
		font-size: 19px;
		font-weight: 650;
	}

	.pagar > span {
		display: flex;
		grid-area: 1 / 1;
		align-items: center;
		gap: 10px;
	}

	/* Pedido: ficha clara sobre el escenario oscuro, como en `OrderCard` */
	.pedido {
		width: 400px;
		padding: 26px;
		border-radius: 22px;
		background: var(--card);
		color: var(--card-foreground);
		box-shadow: 0 50px 120px rgb(0 0 0 / 60%);
	}

	.pedido p {
		font-size: 16px;
		line-height: 1.6;
	}

	.pedido-cabeza {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 18px;
	}

	.pedido-cabeza span:last-child {
		margin-left: auto;
		color: var(--muted-foreground);
		font-size: 15px;
		font-variant-numeric: tabular-nums;
	}

	.punto {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--primary);
	}

	.apagado {
		color: var(--muted-foreground);
	}

	.cobrado {
		color: var(--primary);
		font-weight: 600;
	}

	.pedido-total {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
	}

	.pedido-total strong {
		font-size: 34px;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}

	.leyenda {
		width: 900px;
		color: var(--muted-foreground);
		font-size: 26px;
		text-align: center;
	}

	.leyenda em {
		color: var(--foreground);
		font-style: normal;
	}

	/* Tiendas */
	.tiendas {
		width: 1000px;
	}

	.tiendas-titulo {
		margin-bottom: 16px;
		font-size: 32px;
		font-weight: 650;
		letter-spacing: -0.02em;
	}

	.rejilla {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 20px;
	}

	.tarjeta {
		overflow: hidden;
		border-radius: 14px;
		background: var(--ficha-2);
	}

	.tarjeta img {
		display: block;
		width: 100%;
		height: 230px;
		object-fit: cover;
	}

	.tarjeta-meta {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
	}

	.tarjeta-meta i {
		display: grid;
		place-items: center;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--teal-hondo);
		font-size: 11px;
		font-style: normal;
		font-weight: 700;
	}

	.tarjeta-meta b {
		display: block;
		font-size: 16px;
	}

	.tarjeta-meta small {
		display: block;
		color: var(--muted-foreground);
		font-size: 13px;
	}

	.tarjeta-precio {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 14px;
		font-size: 17px;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.tarjeta-precio span:first-child {
		color: var(--muted-foreground);
		font-weight: 500;
	}

	/* Promesa */
	.promesa {
		width: 1100px;
		font-size: 84px;
		font-weight: 650;
		letter-spacing: -0.04em;
		line-height: 1.04;
		text-align: center;
	}

	.palabra {
		display: inline-block;
		margin: 0 0.12em;
	}

	.resaltada {
		color: var(--primary);
	}

	/*
	 * En el celular el escenario es vertical y cada escena se recompone: una
	 * columna en el catálogo, la foto arriba en la ficha, dos columnas en la
	 * rejilla. El corte es el mismo `VERTICAL` del script.
	 */
	@media (max-width: 639px) {
		.escenario {
			width: 540px;
			height: 880px;
			transform: translate(-50%, -50%) scale(var(--escala, 0.7));
		}

		.marca span,
		.marca-fila span {
			font-size: 58px;
		}

		.marca :global(.marca-logo),
		.marca-fila :global(.marca-logo) {
			width: 72px;
			height: 72px;
		}

		.cierre p {
			font-size: 24px;
		}

		.catalogo {
			width: 470px;
		}

		.chips {
			flex-wrap: wrap;
		}

		.filas {
			grid-template-columns: 1fr;
		}

		.ficha {
			flex-direction: column;
			width: 470px;
			height: 740px;
		}

		.ficha > img {
			width: 100%;
			height: 250px;
		}

		.ficha-info {
			gap: 12px;
			padding: 24px 28px 28px;
		}

		.ficha-nombre {
			font-size: 38px;
		}

		.leyenda {
			width: 460px;
			font-size: 24px;
		}

		.tiendas {
			width: 490px;
		}

		.rejilla {
			grid-template-columns: repeat(2, 1fr);
			gap: 14px;
		}

		.tarjeta img {
			height: 180px;
		}

		.tarjeta-meta small,
		.tarjeta-precio span:first-child {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}

		.tarjeta-meta > div {
			min-width: 0;
		}

		.tarjeta-precio {
			font-size: 15px;
		}

		.promesa {
			width: 480px;
			font-size: 60px;
		}
	}
</style>
