<script lang="ts">
	import GloberceMark from '$lib/components/molecules/GloberceMark.svelte';
	import { TRIAL_DAYS } from '$lib/domain/account';

	/**
	 * El pie del sitio comercial: oscuro, con tres columnas de enlaces y el
	 * nombre de la marca enorme y casi invisible al fondo, como firma. La
	 * rejilla de puntos de la esquina es CSS (`.dot-grid`), no una imagen.
	 */
	const año = new Date().getFullYear();

	const columnas = [
		{
			titulo: 'Producto',
			enlaces: [
				{ href: '#como-funciona', label: 'Cómo funciona' },
				{ href: '#que-vendes', label: 'Para quién es' },
				{ href: '#precios', label: 'Precios' },
				{ href: '#preguntas', label: 'Preguntas' }
			]
		},
		{
			titulo: 'Tu cuenta',
			enlaces: [
				{ href: '/registro', label: 'Empieza gratis' },
				{ href: '/admin/login', label: 'Entrar' }
			]
		},
		{
			titulo: 'Globerce',
			enlaces: [
				{ href: '/contacto', label: 'Contacto' },
				{ href: '/terminos', label: 'Términos' },
				{ href: '/privacidad', label: 'Privacidad' }
			]
		}
	];
</script>

<footer class="marketing-dark bg-background text-foreground relative overflow-hidden">
	<!-- Textura de la esquina: se desvanece hacia arriba y a la derecha para
	     no competir con los enlaces. -->
	<div
		aria-hidden="true"
		class="dot-grid pointer-events-none absolute bottom-0 left-0 h-72 w-80 [mask-image:linear-gradient(to_top_right,black,transparent_70%)]"
	></div>

	<div class="relative mx-auto max-w-6xl px-4 pt-20 pb-10 sm:px-6">
		<div class="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
			<div class="max-w-xs">
				<a href="/" class="flex items-center gap-2" aria-label="Globerce, inicio">
					<GloberceMark size={32} label="" />
					<span class="text-xl font-semibold tracking-tight">Globerce</span>
				</a>
				<p class="text-muted-foreground mt-5 text-sm text-pretty">
					Tu tienda en línea, se venda lo que se venda. {TRIAL_DAYS} días gratis, sin comisión por venta.
				</p>
				<p class="text-muted-foreground mt-5 text-sm">
					Hecho en Colombia, para quien vende todos los días.
				</p>
			</div>

			{#each columnas as columna (columna.titulo)}
				<nav aria-label={columna.titulo}>
					<p class="text-sm font-semibold">{columna.titulo}</p>
					<ul class="text-muted-foreground mt-4 space-y-2.5 text-sm">
						{#each columna.enlaces as enlace (enlace.href)}
							<li>
								<a href={enlace.href} class="hover:text-foreground transition-colors"
									>{enlace.label}</a
								>
							</li>
						{/each}
					</ul>
				</nav>
			{/each}
		</div>

		<div
			class="border-border text-muted-foreground mt-16 flex flex-wrap items-center justify-between gap-4 border-t pt-6 text-xs"
		>
			<p>© {año} Globerce. Todos los derechos reservados.</p>
			<p>Sin comisión por venta · Cancelas cuando quieras</p>
		</div>
	</div>

	<!-- La firma: el nombre a todo el ancho, casi del color del fondo. -->
	<p
		aria-hidden="true"
		class="text-foreground/[0.04] pointer-events-none -mb-[0.2em] text-center text-[19vw] leading-none font-semibold tracking-tighter select-none"
	>
		Globerce
	</p>
</footer>
