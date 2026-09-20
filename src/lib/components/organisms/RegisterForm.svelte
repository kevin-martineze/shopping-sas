<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';

	import ArrowLeft from '@lucide/svelte/icons/arrow-left';

	import { enhance } from '$app/forms';

	import type { Plan } from '$lib/domain/account';
	import type { FieldErrors } from '$lib/utils/form';
	import { Button } from '$lib/components/atoms/button';
	import PasswordField from '$lib/components/molecules/PasswordField.svelte';
	import PhoneField from '$lib/components/molecules/PhoneField.svelte';
	import PlanOption from '$lib/components/molecules/PlanOption.svelte';
	import Stepper from '$lib/components/molecules/Stepper.svelte';
	import TextField from '$lib/components/molecules/TextField.svelte';
	import { TRIAL_DAYS } from '$lib/domain/account';
	import { joinPhone, splitPhone } from '$lib/domain/phone';
	import { PASSWORD_MIN, registerSchema, storeFieldsSchema } from '$lib/schemas/account';
	import { fieldErrors } from '$lib/utils/form';
	import { formatMoney } from '$lib/utils/money';
	import { slugify } from '$lib/utils/slug';

	/**
	 * Abrir una tienda: el plan, la tienda y la cuenta de su dueña.
	 *
	 * Valida con el MISMO esquema que la action del servidor, así que lo que se
	 * ve al escribir es exactamente lo que va a aceptar la API. La validación
	 * del navegador es comodidad, no seguridad: el servidor vuelve a validarlo
	 * todo, y sin JavaScript el formulario funciona igual.
	 *
	 * Los pasos son una capa encima, no una condición: los tres bloques SIEMPRE
	 * se renderizan y solo se ocultan con `hidden` una vez hidratado. Si se
	 * pintaran con `{#if}`, los campos del paso que no se ve no viajarían en el
	 * envío, y sin JavaScript no habría formulario en absoluto.
	 */
	type Campo =
		'storeName' | 'storeSlug' | 'whatsappPhone' | 'fullName' | 'email' | 'password' | 'confirm';

	interface Props {
		/** Con sesión se crea otra tienda para esa cuenta: no se piden sus datos. */
		signedIn: boolean;
		/** Lo que va detrás de la dirección, p. ej. `.globerce.store`. */
		addressSuffix: string | null;
		plans: Plan[];
		selectedPlan: string | undefined;
		/** Lo que devolvió la action: mensaje general, errores por campo y lo tecleado. */
		result: {
			error?: string;
			errors?: FieldErrors;
			values?: Record<string, string | undefined>;
		} | null;
	}

	let { signedIn, addressSuffix, plans, selectedPlan, result }: Props = $props();

	/** Lo tecleado vuelve del servidor para no perderlo cuando algo falla. */
	const enviado = untrack(() => result?.values ?? {});

	// Lo que se guarda es un solo número con indicativo; el formulario lo
	// muestra partido en dos, así que al volver del servidor se reparte.
	const telefono = untrack(() => splitPhone(enviado.whatsappPhone ?? ''));

	let storeName = $state(enviado.storeName ?? '');
	let whatsappCountry = $state(telefono.code);
	let whatsappPhone = $state(telefono.number);
	let fullName = $state(enviado.fullName ?? '');
	let email = $state(enviado.email ?? '');
	let password = $state('');
	let confirm = $state('');
	let planElegido = $state<string | null>(enviado.planCode ?? null);

	/** Mientras la dueña no la toque, la dirección sigue al nombre. */
	let slugEdited = $state(Boolean(enviado.storeSlug));
	let customSlug = $state(enviado.storeSlug ?? '');

	const storeSlug = $derived(slugEdited ? customSlug : slugify(storeName).slice(0, 40));
	const planCode = $derived(planElegido ?? selectedPlan ?? '');

	let submitting = $state(false);
	let clientErrors = $state<FieldErrors>({});
	/** Campos que se volvieron a tocar: su error del servidor ya no aplica. */
	let touched = $state<Record<string, boolean>>({});

	let formulario = $state<HTMLFormElement | null>(null);

	/**
	 * Sin JavaScript no hay pasos: todo se ve de una vez y se envía de una vez.
	 * El servidor renderiza así, y solo al hidratar se reparte en pasos.
	 */
	let hidratado = $state(false);
	let pasoActual = $state(0);

	// `onMount` y no `$effect`: no se reacciona a nada, se constata que hay
	// JavaScript corriendo.
	onMount(() => {
		hidratado = true;
	});

	const values = $derived({
		storeName,
		storeSlug,
		// El esquema valida el número completo, que es lo que viaja a la API.
		whatsappPhone: joinPhone(whatsappCountry, whatsappPhone),
		fullName,
		email,
		password,
		confirm
	});

	const errors = $derived.by(() => {
		const merged: FieldErrors = {};

		for (const [field, message] of Object.entries(result?.errors ?? {})) {
			if (!touched[field]) merged[field] = message;
		}

		return { ...merged, ...clientErrors };
	});

	const schema = $derived(signedIn ? storeFieldsSchema : registerSchema);
	const shape = registerSchema.innerType().shape;

	/**
	 * Los pasos se arman con los que de verdad se piden: con sesión no se pide
	 * la cuenta, y sin precios no hay plan que elegir.
	 */
	const pasos = $derived(
		[
			plans.length > 0 ? { id: 'plan', titulo: 'Plan', campos: [] as Campo[] } : null,
			{
				id: 'tienda',
				titulo: 'Tu tienda',
				campos: ['storeName', 'whatsappPhone', 'storeSlug'] as Campo[]
			},
			signedIn
				? null
				: {
						id: 'cuenta',
						titulo: 'Tu cuenta',
						campos: ['fullName', 'email', 'password', 'confirm'] as Campo[]
					}
		].filter((paso) => paso !== null)
	);

	const titulos = $derived(pasos.map((paso) => paso.titulo));
	const enElUltimo = $derived(pasoActual >= pasos.length - 1);

	/** Se validan solo los campos que se piden: con sesión, los de la cuenta ni se pintan. */
	const campos = $derived(pasos.flatMap((paso) => paso.campos));

	/** Antes de hidratar se ve todo; después, solo el paso en curso. */
	function oculto(id: string): boolean {
		return hidratado && pasos[pasoActual]?.id !== id;
	}

	function setError(field: string, message: string | null) {
		const next = { ...clientErrors };

		if (message) next[field] = message;
		else delete next[field];

		clientErrors = next;
	}

	/** Revisa un campo al salir de él: corregir en caliente es más barato que al final. */
	function check(field: Campo) {
		if (field === 'confirm') {
			setError(
				'confirm',
				password && confirm !== password ? 'Las contraseñas no coinciden.' : null
			);
			return;
		}

		const result = shape[field].safeParse(values[field]);

		setError(field, result.success ? null : (result.error.issues.at(0)?.message ?? null));
	}

	/** Mientras se escribe no se regaña: solo se borra lo que ya no aplica. */
	function clear(field: string) {
		touched = { ...touched, [field]: true };
		if (clientErrors[field]) setError(field, null);
	}

	/** El paso donde vive un campo, para no dejar un error en una pantalla que no se ve. */
	function pasoDe(campo: string): number {
		return pasos.findIndex((paso) => paso.campos.some((suyo) => suyo === campo));
	}

	async function enfocar(campo: string) {
		await tick();
		formulario?.querySelector<HTMLInputElement>(`[name="${campo}"]`)?.focus();
	}

	/**
	 * Lleva el foco —y la vista— al primer campo que falla, esté en el paso que
	 * esté. Un error en un paso oculto es un formulario que no se deja enviar
	 * sin decir por qué.
	 */
	async function irAlPrimerError(fallos: FieldErrors) {
		const primero = campos.find((campo) => campo in fallos);

		if (!primero) return;

		const indice = pasoDe(primero);

		if (indice >= 0) pasoActual = indice;

		await enfocar(primero);
	}

	/** Avanza solo si lo de este paso está bien: así el error se corrige donde se escribió. */
	function siguiente() {
		const actual = pasos[pasoActual];

		if (!actual) return;

		for (const campo of actual.campos) check(campo);

		const fallo = actual.campos.find((campo) => campo in clientErrors);

		if (fallo) {
			void enfocar(fallo);
			return;
		}

		pasoActual = Math.min(pasoActual + 1, pasos.length - 1);
	}
</script>

<!--
	`novalidate` apaga los avisos del navegador a propósito: los mensajes salen
	del mismo esquema que valida el servidor, en español y bajo cada campo, y no
	de una burbuja que dice "Completa este campo" y tapa lo que sigue. Sin
	JavaScript no se pierde nada: el que valida de verdad es el servidor.
-->
<form
	method="POST"
	novalidate
	bind:this={formulario}
	class="space-y-8"
	use:enhance={({ cancel }) => {
		// Enter dentro de un campo envía el formulario. Si aún faltan pasos, eso
		// no es "quiero registrarme": es "quiero seguir".
		if (hidratado && !enElUltimo) {
			cancel();
			siguiente();

			return;
		}

		const parsed = schema.safeParse(values);

		if (!parsed.success) {
			const fallos = fieldErrors(parsed.error);

			clientErrors = fallos;
			cancel();
			void irAlPrimerError(fallos);

			return;
		}

		submitting = true;

		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;

			// Lo que solo sabe el servidor —una dirección ya tomada, un correo
			// repetido— llega después del envío, y puede caer en un paso atrás.
			const devueltos = result?.errors;

			if (devueltos) await irAlPrimerError(devueltos);
		};
	}}
>
	{#if hidratado && pasos.length > 1}
		<Stepper pasos={titulos} actual={pasoActual} onir={(indice) => (pasoActual = indice)} />
	{/if}

	{#if !hidratado}
		<p class="text-muted-foreground text-xs">Todos los campos son obligatorios.</p>
	{/if}

	{#if plans.length > 0}
		<fieldset class="space-y-4" hidden={oculto('plan')}>
			<legend class="mb-3 text-sm font-medium">Elige tu plan</legend>

			<div class="grid gap-3 sm:grid-cols-3">
				{#each plans as plan (plan.code)}
					<PlanOption
						{plan}
						seleccionado={planCode === plan.code}
						onseleccionar={() => (planElegido = plan.code)}
					/>
				{/each}
			</div>

			<p class="text-muted-foreground text-xs">
				{#if signedIn}
					Cada tienda tiene su propio plan. Los primeros {TRIAL_DAYS} días son gratis.
				{:else}
					Los primeros {TRIAL_DAYS} días son gratis y no pedimos tarjeta. Puedes cambiar de plan cuando
					quieras desde tu panel.
				{/if}
			</p>
		</fieldset>
	{/if}

	<fieldset class="space-y-4" hidden={oculto('tienda')}>
		<legend class="mb-3 text-sm font-medium">Tu tienda</legend>

		<div class="grid gap-4 sm:grid-cols-2">
			<TextField
				name="storeName"
				label="Nombre de la tienda"
				bind:value={storeName}
				error={errors.storeName}
				required
				maxlength={80}
				placeholder="Boutique Mariposa"
				oninput={() => clear('storeName')}
				onblur={() => check('storeName')}
			/>

			<PhoneField
				name="whatsappPhone"
				label="WhatsApp de ventas"
				bind:value={whatsappPhone}
				bind:country={whatsappCountry}
				error={errors.whatsappPhone}
				hint="Aquí llegan los pedidos."
				required
				placeholder="300 123 4567"
				oninput={() => clear('whatsappPhone')}
				onblur={() => check('whatsappPhone')}
			/>
		</div>

		<TextField
			name="storeSlug"
			label="Dirección de tu tienda"
			value={storeSlug}
			error={errors.storeSlug}
			hint="Minúsculas, números y guiones. No se puede cambiar después."
			required
			minlength={3}
			maxlength={40}
			suffix={addressSuffix ?? undefined}
			oninput={(event) => {
				slugEdited = true;
				customSlug = event.currentTarget.value;
				clear('storeSlug');
			}}
			onblur={() => check('storeSlug')}
		/>
	</fieldset>

	{#if !signedIn}
		<fieldset class="space-y-4" hidden={oculto('cuenta')}>
			<legend class="mb-3 text-sm font-medium">Tu cuenta</legend>

			<div class="grid gap-4 sm:grid-cols-2">
				<TextField
					name="fullName"
					label="Tu nombre y apellido"
					bind:value={fullName}
					error={errors.fullName}
					required
					autocomplete="name"
					placeholder="María Restrepo"
					oninput={() => clear('fullName')}
					onblur={() => check('fullName')}
				/>

				<TextField
					name="email"
					label="Correo"
					type="email"
					bind:value={email}
					error={errors.email}
					hint="Con este entras al panel."
					required
					autocomplete="username"
					placeholder="maria@correo.com"
					oninput={() => clear('email')}
					onblur={() => check('email')}
				/>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<PasswordField
					name="password"
					label="Contraseña"
					bind:value={password}
					error={errors.password}
					hint={`Mínimo ${PASSWORD_MIN} caracteres. Una frase es más fácil de recordar.`}
					required
					minlength={PASSWORD_MIN}
					oninput={() => clear('password')}
					onblur={() => check('password')}
				/>

				<PasswordField
					name="confirm"
					label="Repite la contraseña"
					bind:value={confirm}
					error={errors.confirm}
					required
					oninput={() => clear('confirm')}
					onblur={() => check('confirm')}
				/>
			</div>
		</fieldset>
	{/if}

	{#if result?.error}
		<p class="text-destructive text-sm">{result.error}</p>
	{/if}

	<div class="space-y-3">
		{#if hidratado && plans.length > 0 && pasos[pasoActual]?.id !== 'plan'}
			<!-- Lo que se está comprando no desaparece al pasar de paso: decidir el
			     plan y luego no verlo más es la forma fácil de dudar al final. -->
			{@const elegido = plans.find((plan) => plan.code === planCode)}
			{#if elegido}
				<p class="text-muted-foreground text-xs">
					Plan {elegido.name} · {formatMoney(elegido.price_cop)} / mes, gratis los primeros {TRIAL_DAYS}
					días.
				</p>
			{/if}
		{/if}

		<!-- La acción va a la derecha y del ancho de su texto: un botón que cruza
		     toda la pantalla pesa lo mismo que el formulario entero, y avanzar un
		     paso no es la decisión más importante de la página. `Atrás` se empuja
		     al otro extremo para que no compita con ella. -->
		<div class="flex items-center justify-end gap-3">
			{#if hidratado && pasoActual > 0}
				<Button type="button" variant="outline" class="mr-auto" onclick={() => (pasoActual -= 1)}>
					<ArrowLeft class="size-4" />
					Atrás
				</Button>
			{/if}

			{#if hidratado && !enElUltimo}
				<Button type="button" onclick={siguiente}>Continuar</Button>
			{:else}
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Creando tu tienda…' : 'Crear mi tienda'}
				</Button>
			{/if}
		</div>
	</div>
</form>
