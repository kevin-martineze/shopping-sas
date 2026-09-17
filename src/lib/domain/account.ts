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
			text: 'Tu plan venció. La tienda sigue vendiendo, pero registra el pago para no perder el servicio.'
		};
	}

	if (summary.store_status === 'trial') {
		if (summary.days_left < 0) {
			return {
				tone: 'warning',
				text: 'Tu prueba terminó. Registra el pago para seguir vendiendo sin interrupciones.'
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
