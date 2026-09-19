<script lang="ts">
	import LegalPage from '$lib/components/molecules/LegalPage.svelte';
	import { EMPRESA } from '$lib/config/empresa';
</script>

<svelte:head>
	<title>Privacidad — Globerce</title>
	<meta name="description" content="Qué datos trata Globerce, para qué y qué puedes pedir." />
</svelte:head>

<LegalPage
	title="Política de privacidad"
	summary="Qué datos tratamos, para qué, con quién se comparten y qué puedes pedirnos."
>
	<section>
		<h2>1. Quién trata tus datos</h2>
		<p>
			{#if EMPRESA.razonSocial}
				{EMPRESA.razonSocial}{#if EMPRESA.nit}, NIT {EMPRESA.nit}{/if}, que opera {EMPRESA.marca}.
			{:else}
				Quien opera {EMPRESA.marca}.
			{/if}
			Para los datos de tu propia cuenta somos responsables del tratamiento; para los datos de las clientas
			de tu tienda somos encargados: los guardamos por cuenta tuya y hacemos con ellos lo que tú nos indiques.
		</p>
	</section>

	<section>
		<h2>2. Qué datos tratamos</h2>
		<ul>
			<li>
				<strong>De ti, que tienes la tienda:</strong> nombre, correo, WhatsApp de ventas y el nombre de
				tu tienda. También el historial de pagos de tu plan.
			</li>
			<li>
				<strong>De tus clientas:</strong> nombre, teléfono y dirección de envío cuando hacen un pedido.
				No pedimos datos de tarjetas: no procesamos pagos de las compras.
			</li>
			<li>
				<strong>Técnicos:</strong> la dirección IP de cada petición, que se usa para limitar intentos
				de inicio de sesión y evitar abuso, y las fechas de acceso.
			</li>
		</ul>
	</section>

	<section>
		<h2>3. Para qué</h2>
		<p>
			Para prestar el servicio: mostrar tu tienda, guardar tus pedidos, cobrar tu plan y escribirte
			cuando haga falta (recuperar la contraseña, invitaciones a tu equipo, avisos del plan). No
			vendemos datos ni los usamos para publicidad de terceros.
		</p>
	</section>

	<section>
		<h2>4. Con quién se comparten</h2>
		<p>
			Solo con los proveedores que hacen funcionar el servicio, y únicamente para eso: alojamiento
			del servidor y la base de datos, almacenamiento de las fotos y el proveedor de correo. Cada
			tienda está aislada de las demás dentro de la base de datos, por diseño: una tienda no puede
			leer los datos de otra aunque lo intente.
		</p>
	</section>

	<section>
		<h2>5. Cookies</h2>
		<p>
			Usamos una cookie cifrada para mantener la sesión del panel: sin ella habría que entrar en
			cada página. En la tienda, el carrito y los favoritos se guardan en tu propio navegador y no
			salen de él hasta que confirmas el pedido. No usamos cookies de publicidad ni de rastreo entre
			sitios.
		</p>
	</section>

	<section>
		<h2>6. Cuánto tiempo</h2>
		<p>
			Mientras la tienda exista. Al cerrarla borramos sus datos después de un plazo razonable para
			que puedas llevártelos; conservamos lo que la ley obligue a conservar, como los registros de
			los pagos del plan.
		</p>
	</section>

	<section>
		<h2>7. Tus derechos</h2>
		<p>
			Puedes conocer, actualizar y rectificar tus datos, pedir una copia, revocar la autorización y
			pedir que se supriman cuando no haya un deber legal de conservarlos (Ley 1581 de 2012 y sus
			decretos, en {EMPRESA.pais}). Las clientas de una tienda pueden ejercer esos derechos ante la
			tienda; si nos escriben a nosotros, las ponemos en contacto y ayudamos a atender la solicitud.
		</p>
		<p>
			Para ejercerlos, escríbenos desde <a href="/contacto">la página de contacto</a>. Respondemos
			dentro de los plazos de ley.
		</p>
	</section>

	<section>
		<h2>8. Seguridad</h2>
		<p>
			Las contraseñas se guardan cifradas con un algoritmo diseñado para eso, nunca en texto plano.
			El tráfico va por HTTPS y hacemos copias de seguridad diarias de la base de datos. Ningún
			sistema es infalible: si ocurriera un incidente que afecte tus datos, te avisamos y lo
			reportamos a la autoridad, como manda la ley.
		</p>
	</section>
</LegalPage>
