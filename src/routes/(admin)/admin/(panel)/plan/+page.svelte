<script lang="ts">
	import type { PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import UsageMeter from '$lib/components/molecules/UsageMeter.svelte';
	import { STORE_STATUS_LABEL } from '$lib/domain/account';
	import { formatMoney } from '$lib/utils/money';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const subscription = $derived(data.subscription);
	const plan = $derived(subscription.plan);

	const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' });

	const periodEnd = $derived(
		dateFormatter.format(new Date(`${subscription.current_period_end}T00:00:00Z`))
	);
</script>

<svelte:head>
	<title>Plan — Panel</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Tu plan</h1>
	<p class="text-muted-foreground text-sm">
		Qué incluye, cuánto llevas usado y hasta cuándo está pago.
	</p>
</header>

<div class="grid gap-6 lg:grid-cols-3">
	<section class="border-border bg-background space-y-4 border p-6 lg:col-span-1">
		<div class="flex items-center justify-between gap-2">
			<h2 class="text-2xl">{plan.name}</h2>
			<Badge variant={subscription.store_status === 'active' ? 'default' : 'secondary'}>
				{STORE_STATUS_LABEL[subscription.store_status]}
			</Badge>
		</div>

		<p class="text-3xl font-semibold">
			{formatMoney(plan.price_cop)}<span class="text-muted-foreground text-sm font-normal">
				/ mes</span
			>
		</p>

		<dl class="space-y-2 text-sm">
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">
					{subscription.store_status === 'trial' ? 'La prueba termina' : 'Pago hasta'}
				</dt>
				<dd>{periodEnd}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">Días restantes</dt>
				<dd>{Math.max(0, subscription.days_left)}</dd>
			</div>
			<div class="flex justify-between gap-4">
				<dt class="text-muted-foreground">Dominio propio</dt>
				<dd>{plan.custom_domain ? 'Incluido' : 'No incluido'}</dd>
			</div>
		</dl>

		<p class="text-muted-foreground border-border border-t pt-4 text-xs">
			Los pagos se registran a mano por ahora. Para pagar o cambiar de plan, escríbenos por WhatsApp
			con el nombre de tu tienda.
		</p>
	</section>

	<section class="border-border bg-background space-y-6 border p-6 lg:col-span-2">
		<h2 class="text-lg">Uso</h2>

		<UsageMeter
			label="Prendas"
			used={subscription.usage.products}
			limit={plan.max_products}
			hint="Las archivadas también cuentan."
		/>

		<UsageMeter
			label="Pedidos de este mes"
			used={subscription.usage.orders_this_month}
			limit={plan.max_orders_per_month}
			hint="Se reinicia el día 1, hora de Colombia."
		/>

		<div class="text-sm">
			<p>Fotos por prenda</p>
			<p class="text-muted-foreground">
				{plan.max_images_per_product === null
					? 'Sin límite'
					: `Hasta ${plan.max_images_per_product} por prenda`}
			</p>
		</div>

		<p class="text-muted-foreground text-xs">
			Al llegar a un límite no se borra nada: solo no puedes crear más hasta cambiar de plan.
		</p>
	</section>
</div>
