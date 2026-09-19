/** Cuenta, equipo, plan y plataforma. Los estados van en minúsculas, como el resto del dominio. */

export type MemberRole = 'owner' | 'staff';

export const MEMBER_ROLE_LABEL: Record<MemberRole, string> = {
	owner: 'Dueña',
	staff: 'Personal'
};

export type StoreStatus = 'trial' | 'active' | 'past_due' | 'suspended';

export const STORE_STATUS_LABEL: Record<StoreStatus, string> = {
	trial: 'En prueba',
	active: 'Activa',
	past_due: 'Vencida',
	suspended: 'Suspendida'
};

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'cancelled';

export interface TeamMember {
	user_id: string;
	email: string;
	full_name: string | null;
	role: MemberRole;
	joined_at: string;
}

export interface TeamInvitation {
	id: string;
	email: string;
	role: MemberRole;
	invited_by: string | null;
	expires_at: string;
	created_at: string;
}

export interface Plan {
	code: string;
	name: string;
	price_cop: number;
	/** Null: sin límite. */
	max_products: number | null;
	max_orders_per_month: number | null;
	max_images_per_product: number | null;
	custom_domain: boolean;
	active: boolean;
}

/** Un pago de la tienda, visto desde su propio panel. */
export interface StorePayment {
	id: string;
	amount_cop: number;
	/** `YYYY-MM-DD`. */
	period_start: string;
	period_end: string;
	/** `simulado` mientras no hay pasarela. */
	method: string;
	created_at: string;
}

export interface SubscriptionSummary {
	plan: Plan;
	status: SubscriptionStatus;
	store_status: StoreStatus;
	/** `YYYY-MM-DD`. */
	current_period_end: string;
	trial_ends_at: string | null;
	/** Negativo si ya venció. */
	days_left: number;
	usage: { products: number; orders_this_month: number };
	/** Si la tienda puede activar su plan sola, sin escribirle a nadie. */
	self_service_billing: boolean;
	/** Sus pagos, el más nuevo primero. */
	payments: StorePayment[];
}

export interface PlatformMember {
	user_id: string;
	email: string;
	full_name: string | null;
	role: MemberRole;
}

export interface PlatformStore {
	id: string;
	name: string;
	slug: string;
	custom_domain: string | null;
	status: StoreStatus;
	trial_ends_at: string | null;
	created_at: string;
	plan_code: string | null;
	subscription_status: SubscriptionStatus | null;
	current_period_end: string | null;
	members: PlatformMember[];
	product_count: number;
	order_count: number;
}

export interface PlatformPayment {
	id: string;
	amount_cop: number;
	period_start: string;
	period_end: string;
	method: string;
	reference: string | null;
	recorded_by: string | null;
	created_at: string;
}

export interface PlatformStoreDetail extends PlatformStore {
	subscription_notes: string | null;
	payments: PlatformPayment[];
}

export type NoticeTone = 'danger' | 'warning' | 'info';

export interface SubscriptionNotice {
	tone: NoticeTone;
	text: string;
}

/** Días antes del fin de la prueba en que el panel empieza a avisar. */
const TRIAL_WARNING_DAYS = 7;

function days(count: number): string {
	return count === 1 ? '1 día' : `${count} días`;
}

/** Qué se le pide a la dueña para volver a estar al día, según haya pasarela o no. */
function comoPagar(summary: SubscriptionSummary): string {
	return summary.self_service_billing
		? 'Actívalo desde Tu plan y vuelves a editar al instante.'
		: 'Escríbenos para registrar el pago.';
}

/**
 * El aviso que muestra el panel según el estado de la tienda, o null si todo
 * está al día. Función pura: el panel solo la pinta.
 */
export function subscriptionNotice(summary: SubscriptionSummary): SubscriptionNotice | null {
	if (summary.store_status === 'suspended') {
		return {
			tone: 'danger',
			text: 'Tu tienda está suspendida: no se ve en internet y el panel queda en solo lectura. Escríbenos para reactivarla.'
		};
	}

	if (summary.store_status === 'past_due') {
		return {
			tone: 'warning',
			// Vencida sigue vendiendo: lo que se pierde es poder editar.
			text: `Tu plan venció: la tienda sigue vendiendo, pero el panel quedó en solo lectura. ${comoPagar(summary)}`
		};
	}

	if (summary.store_status === 'trial') {
		if (summary.days_left < 0) {
			return {
				tone: 'warning',
				text: `Tu prueba terminó. ${comoPagar(summary)}`
			};
		}

		if (summary.days_left <= TRIAL_WARNING_DAYS) {
			return {
				tone: 'info',
				text: `Te quedan ${days(summary.days_left)} de prueba gratis.`
			};
		}
	}

	if (summary.store_status === 'active' && summary.days_left >= 0 && summary.days_left <= 3) {
		return {
			tone: 'info',
			text: `Tu plan se renueva en ${days(summary.days_left)}.`
		};
	}

	return null;
}

/** Cuánto del límite lleva usado, de 0 a 100. Null si el plan no tiene límite. */
export function usagePercent(used: number, limit: number | null): number | null {
	if (limit === null || limit <= 0) return null;

	return Math.min(100, Math.round((used / limit) * 100));
}

export interface PlatformStoreRef {
	id: string;
	name: string;
	slug: string;
	owner_email: string | null;
}

export interface TrialEnding extends PlatformStoreRef {
	trial_ends_at: string;
	/** Negativo si ya venció y el cron no ha pasado. */
	days_left: number;
}

export interface OverdueStore extends PlatformStoreRef {
	current_period_end: string | null;
	days_overdue: number;
}

export interface PlatformPaymentRow extends PlatformPayment {
	store_id: string;
	store_name: string;
	store_slug: string;
}

export interface PlatformDashboard {
	stores: { total: number; trial: number; active: number; past_due: number; suspended: number };
	paying_stores: number;
	/** Ingreso mensual recurrente: suma del plan de las tiendas que pagan. */
	mrr: number;
	revenue_this_month: number;
	revenue_last_month: number;
	trials_ending: TrialEnding[];
	overdue: OverdueStore[];
	recent_payments: PlatformPaymentRow[];
}

export interface MonthPayments {
	month: string;
	total: number;
	payments: PlatformPaymentRow[];
}

/** Días de prueba con que arranca toda tienda. Igual que `TRIAL_DAYS` en la API. */
export const TRIAL_DAYS = 14;

/**
 * Lo que un plan ofrece, en frases para el sitio comercial.
 *
 * Los números salen de la API, así que cambiar un límite en la consola cambia
 * la página de precios sin tocar código. `null` es "sin límite", y ahí la
 * frase cambia en vez de mostrar la palabra "null".
 */
export function planFeatures(plan: Plan): string[] {
	const cantidad = (limite: number | null, singular: string, plural: string) =>
		limite === null
			? `${plural} sin límite`
			: `Hasta ${limite} ${limite === 1 ? singular : plural}`;

	return [
		cantidad(plan.max_products, 'prenda', 'prendas'),
		`${cantidad(plan.max_orders_per_month, 'pedido', 'pedidos')} al mes`,
		cantidad(plan.max_images_per_product, 'foto', 'fotos') + ' por prenda',
		plan.custom_domain ? 'Tu propio dominio' : 'Dirección propia en globerce.store',
		'Pedidos por WhatsApp, sin comisión'
	];
}
