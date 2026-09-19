<script lang="ts">
	import { untrack } from 'svelte';

	import { enhance } from '$app/forms';

	import type { Plan } from '$lib/domain/account';
	import type { FieldErrors } from '$lib/utils/form';
	import { Button } from '$lib/components/atoms/button';
	import PasswordField from '$lib/components/molecules/PasswordField.svelte';
	import TextField from '$lib/components/molecules/TextField.svelte';
	import { TRIAL_DAYS } from '$lib/domain/account';
	import { PASSWORD_MIN, registerSchema, storeFieldsSchema } from '$lib/schemas/account';
	import { cn } from '$lib/utils';
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
	 */
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

	let storeName = $state(enviado.storeName ?? '');
	let whatsappPhone = $state(enviado.whatsappPhone ?? '');
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

	const values = $derived({
		storeName,
		storeSlug,
		whatsappPhone,
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

	/** Se validan solo los campos que se piden: con sesión, los de la cuenta ni se pintan. */
	const campos = $derived(
		signedIn
			? (['storeName', 'storeSlug', 'whatsappPhone'] as const)
			: ([
					'storeName',
					'storeSlug',
					'whatsappPhone',
					'fullName',
					'email',
					'password',
					'confirm'
				] as const)
	);

	function setError(field: string, message: string | null) {
		const next = { ...clientErrors };

		if (message) next[field] = message;
		else delete next[field];

		clientErrors = next;
	}

	/** Revisa un campo al salir de él: corregir en caliente es más barato que al final. */
	function check(field: (typeof campos)[number]) {
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

	/**
	 * Los pasos se numeran contando solo los que se pintan: con sesión no se
	 * pide la cuenta, y sin precios no hay plan que elegir. Así no queda un
	 * hueco en la serie.
	 */
	const pasos = $derived(
		[plans.length > 0 ? 'plan' : null, 'tienda', signedIn ? null : 'cuenta'].filter(
			(paso) => paso !== null
		)
	);

	const paso = $derived((nombre: string) => `${pasos.indexOf(nombre) + 1}. `);
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
	class="space-y-8"
	use:enhance={({ cancel, formElement }) => {
		const parsed = schema.safeParse(values);

		if (!parsed.success) {
			clientErrors = fieldErrors(parsed.error);
			// El primero que falla se lleva el foco: sin esto, en un formulario
			// largo el error puede quedar fuera de la pantalla.
			const primero = campos.find((campo) => campo in clientErrors);

			if (primero) formElement.querySelector<HTMLInputElement>(`[name="${primero}"]`)?.focus();

			cancel();

			return;
		}

		submitting = true;

		return async ({ update }) => {
			await update({ reset: false });
			submitting = false;
		};
	}}
>
	<p class="text-muted-foreground text-xs">Todos los campos son obligatorios.</p>

	{#if plans.length > 0}
		<fieldset class="space-y-3">
			<legend class="mb-3 text-sm font-medium">{paso('plan')}Tu plan</legend>

			<div class="grid gap-3 sm:grid-cols-2">
				{#each plans as plan (plan.code)}
					<label
						class={cn(
							'border-border hover:border-foreground/40 flex cursor-pointer items-center justify-between gap-3 border p-4 transition-colors',
							planCode === plan.code && 'border-foreground bg-muted/50'
						)}
					>
						<span class="flex flex-col gap-1">
							<span class="font-medium">{plan.name}</span>
							<span class="text-muted-foreground text-xs">
								{plan.max_products === null
									? 'Prendas sin límite'
									: `Hasta ${plan.max_products} prendas`}
							</span>
						</span>
						<span class="flex items-center gap-3">
							<span class="text-sm whitespace-nowrap tabular-nums">
								{formatMoney(plan.price_cop)}<span class="text-muted-foreground text-xs">
									/ mes</span
								>
							</span>
							<input
								type="radio"
								name="planCode"
								value={plan.code}
								checked={planCode === plan.code}
								onchange={() => (planElegido = plan.code)}
								class="accent-foreground size-4"
							/>
						</span>
					</label>
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

	<fieldset class="space-y-4">
		<legend class="mb-3 text-sm font-medium">{paso('tienda')}Tu tienda</legend>

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

			<TextField
				name="whatsappPhone"
				label="WhatsApp de ventas"
				type="tel"
				bind:value={whatsappPhone}
				error={errors.whatsappPhone}
				hint="Con indicativo del país. Aquí llegan los pedidos."
				required
				autocomplete="tel"
				placeholder="57 300 123 4567"
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
		<fieldset class="space-y-4">
			<legend class="mb-3 text-sm font-medium">{paso('cuenta')}Tu cuenta</legend>

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

	<Button type="submit" class="w-full" disabled={submitting}>
		{submitting ? 'Creando tu tienda…' : 'Crear mi tienda'}
	</Button>
</form>
