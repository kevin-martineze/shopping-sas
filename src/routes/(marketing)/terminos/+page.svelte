<script lang="ts">
	import LegalPage from '$lib/components/molecules/LegalPage.svelte';
	import { EMPRESA } from '$lib/config/empresa';
	import { TRIAL_DAYS } from '$lib/domain/account';
</script>

<svelte:head>
	<title>Términos del servicio — Globerce</title>
	<meta name="description" content="Las condiciones con las que se usa Globerce." />
</svelte:head>

<LegalPage
	title="Términos del servicio"
	summary="Las condiciones con las que {EMPRESA.marca} le presta el servicio a tu tienda."
>
	<section>
		<h2>1. Qué es este servicio</h2>
		<p>
			{EMPRESA.marca} es un servicio por suscripción para que una marca de ropa publique su catálogo en
			internet, lleve su inventario y reciba pedidos. Los pedidos se cierran por WhatsApp, entre la tienda
			y su clienta: {EMPRESA.marca} no cobra las ventas, no procesa pagos de las compras ni interviene
			en el envío.
		</p>
	</section>

	<section>
		<h2>2. Tu cuenta</h2>
		<p>
			Quien registra la tienda es su dueña y responde por lo que pase con ella. Puede invitar a más
			personas y quitarles el acceso cuando quiera. Cuidar la contraseña es parte del trato: quien
			la tenga puede hacer todo lo que puedes hacer tú.
		</p>
		<p>
			La dirección de tu tienda (el subdominio) se elige al registrarse y no se puede cambiar
			después, porque es la dirección que tus clientas van a tener guardada.
		</p>
	</section>

	<section>
		<h2>3. Lo que publicas</h2>
		<p>
			Tus prendas, tus fotos y tus textos son tuyos. Nos das permiso para alojarlos y mostrarlos,
			que es lo que hace falta para que tu tienda exista en internet, y para nada más: no los usamos
			en publicidad ni los cedemos a terceros.
		</p>
		<p>
			A cambio, respondes por tener derecho a publicarlos y por cumplir la ley que le aplique a lo
			que vendes: descripciones ciertas, precios claros, derecho de retracto y garantías de tus
			clientas. No se puede usar {EMPRESA.marca} para vender lo que la ley prohíbe.
		</p>
	</section>

	<section>
		<h2>4. Planes, prueba y pago</h2>
		<ul>
			<li>Toda tienda empieza con {TRIAL_DAYS} días de prueba, sin tarjeta.</li>
			<li>
				Después, el plan se paga por mes adelantado. Los precios están en la página de inicio.
			</li>
			<li>
				Cada plan tiene límites (prendas, pedidos al mes, fotos por prenda). Al llegar a uno no se
				borra nada: solo no se puede crear más hasta cambiar de plan.
			</li>
			<li>
				Cambiar de plan se aplica al pagarlo y el mes nuevo corre desde que termina el vigente.
			</li>
		</ul>
	</section>

	<section>
		<h2>5. Si el plan vence</h2>
		<p>
			Tu tienda sigue vendiendo: cortarle las ventas a una tienda por un pago atrasado castiga a sus
			clientas, no a nosotros. Lo que queda en pausa es el panel, que pasa a solo lectura hasta que
			el plan se ponga al día. Puedes seguir consultando y exportando lo tuyo.
		</p>
	</section>

	<section>
		<h2>6. Suspensión</h2>
		<p>
			Podemos suspender una tienda cuando su contenido sea ilegal, cuando el uso ponga en riesgo el
			servicio de las demás o cuando una autoridad lo ordene. Una tienda suspendida deja de verse en
			internet y su panel queda en solo lectura. Avisamos por correo y explicamos el motivo.
		</p>
	</section>

	<section>
		<h2>7. Disponibilidad</h2>
		<p>
			Trabajamos para que el servicio esté siempre disponible, pero no prometemos que nunca se
			caiga: ningún servicio honesto lo promete. Hacemos mantenimiento en horas de bajo tráfico y
			avisamos cuando se espera una interrupción.
		</p>
	</section>

	<section>
		<h2>8. Cerrar la cuenta</h2>
		<p>
			Puedes irte cuando quieras, sin permanencia. Al cerrar la tienda dejamos de cobrarte y la
			tienda pública se apaga; los meses ya pagados no se devuelven. Antes de borrar nada te damos
			un plazo razonable para llevarte tus datos, y puedes pedirnos una copia escribiéndonos.
		</p>
	</section>

	<section>
		<h2>9. Responsabilidad</h2>
		<p>
			El servicio se presta tal como está. No respondemos por las ventas que hagas o dejes de hacer,
			ni por lo que ocurra entre tú y tus clientas. Si algo es culpa nuestra, nuestra
			responsabilidad se limita a lo que nos hayas pagado en los últimos tres meses.
		</p>
	</section>

	<section>
		<h2>10. Cambios y ley aplicable</h2>
		<p>
			Si cambiamos estos términos te avisamos por correo antes de que rijan. Seguir usando el
			servicio después de esa fecha significa aceptarlos. Estos términos se rigen por las leyes de
			{EMPRESA.pais}.
		</p>
		<p>
			¿Dudas? Escríbenos desde <a href="/contacto">la página de contacto</a>.
		</p>
	</section>
</LegalPage>
