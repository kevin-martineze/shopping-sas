<script lang="ts">
	import AlertTriangle from '@lucide/svelte/icons/triangle-alert';
	import Check from '@lucide/svelte/icons/check';
	import Circle from '@lucide/svelte/icons/circle';

	import { Label } from '$lib/components/atoms/label';
	import { Textarea } from '$lib/components/atoms/textarea';
	import { completeWompiKeys, mixedModes, parseWompiKeys } from '$lib/domain/wompi';
	import { cn } from '$lib/utils';

	/**
	 * Conectar Wompi de un solo pegado.
	 *
	 * Wompi no tiene «conectar con un clic»: no existe una redirección que
	 * vuelva con la cuenta ya enlazada —se verificó contra su documentación—,
	 * así que copiar las cuatro llaves del panel de comercios es, hoy, el
	 * único camino. Lo que sí se puede simplificar es que sean cuatro pegados:
	 * las cuatro llaves tienen prefijos distintos (`pub_`, `prv_`,
	 * `…_integrity_`, `…_events_`), así que un solo cuadro las reconoce todas
	 * de lo que se pegue, en cualquier orden y aunque traigan las etiquetas
	 * del panel de Wompi.
	 *
	 * Los cuatro campos ocultos son la fuente de verdad que envía el form: los
	 * llena `parseWompiKeys` a cada tecla, y sin JavaScript el cuadro se pega
	 * como texto y el servidor hace el mismo reconocimiento (`?/conectar`).
	 */
	interface Props {
		error?: string | null;
		/**
		 * A dónde mandar a quien no tiene JavaScript para pegarlas una por una.
		 * Sin él no se ofrece esa salida: en el registro no hay formulario
		 * manual, y las llaves son opcionales.
		 */
		manualHref?: string | null;
	}

	let { error = null, manualHref = '#wompi-manual' }: Props = $props();

	let texto = $state('');
	const keys = $derived(parseWompiKeys(texto));
	const completas = $derived(completeWompiKeys(keys));
	const mezcladas = $derived(mixedModes(keys));

	const campos = [
		{ field: 'publicKey' as const, label: 'Llave pública' },
		{ field: 'privateKey' as const, label: 'Llave privada' },
		{ field: 'integritySecret' as const, label: 'Secreto de integridad' },
		{ field: 'eventsSecret' as const, label: 'Secreto de eventos' }
	];
</script>

<div class="space-y-3">
	<Label for="wompi-paste">Pega tus cuatro llaves</Label>

	<Textarea
		id="wompi-paste"
		bind:value={texto}
		rows={4}
		placeholder="Pega aquí lo que copiaste del panel de comercios de Wompi: las cuatro llaves, en el orden que sea."
		aria-describedby="wompi-paste-hint"
		aria-invalid={error ? 'true' : undefined}
	/>

	{#if error}
		<p class="text-destructive text-sm">{error}</p>
	{/if}

	<ul id="wompi-paste-hint" class="grid gap-1.5 text-sm sm:grid-cols-2">
		{#each campos as campo (campo.field)}
			{@const encontrada = keys[campo.field]}
			<li
				class={cn(
					'flex items-center gap-2',
					encontrada ? 'text-foreground' : 'text-muted-foreground'
				)}
			>
				{#if encontrada}
					<Check class="text-primary size-4 flex-none" />
				{:else}
					<Circle class="size-4 flex-none" />
				{/if}
				{campo.label}
				{#if encontrada}
					<span class="text-muted-foreground font-mono text-xs">
						{encontrada.slice(0, encontrada.indexOf('_', encontrada.indexOf('_') + 1) + 5)}…
					</span>
				{/if}
			</li>
		{/each}
	</ul>

	{#if mezcladas}
		<p class="text-caution flex items-start gap-2 text-sm">
			<AlertTriangle class="mt-0.5 size-4 flex-none" />
			Estás mezclando llaves de pruebas con llaves de producción. Revisa que las cuatro vengan del mismo
			modo en tu panel de Wompi.
		</p>
	{/if}

	<!--
		Lo único que viaja de aquí es el texto tal cual: el servidor hace el
		mismo reconocimiento sobre `pasteText` (funciona igual sin JavaScript).
		No se manda cada llave en un campo con su nombre —`publicKey`,
		`privateKey`…— porque el formulario manual de abajo usa esos mismos
		nombres para sus propios campos, y dos entradas con el mismo nombre en
		un `<form>` chocan: `FormData` solo ve la primera.
	-->
	<input type="hidden" name="pasteText" value={texto} />

	<p class="text-muted-foreground text-xs">
		{#if completas}
			Reconocimos las cuatro. Revisa que sean las correctas.
		{:else if manualHref}
			¿No tienes JavaScript o prefieres pegarlas una por una? Usa
			<a href={manualHref} class="underline underline-offset-2">el formulario de abajo</a>.
		{:else}
			Pégalas juntas: las reconocemos por su prefijo, en el orden que sea.
		{/if}
	</p>
</div>
