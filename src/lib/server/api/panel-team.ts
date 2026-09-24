import type {
	MemberRole,
	PaymentMethod,
	Plan,
	StorePayment,
	SubscriptionSummary,
	TeamInvitation,
	TeamMember
} from '$lib/domain/account';
import type { ApiResult } from '$lib/server/api/client';
import type { PanelContext } from '$lib/server/context';

import { z } from 'zod';

import { panelRequest, segment } from '$lib/server/api/request';
import {
	memberRoleSchema,
	storeStatusSchema,
	subscriptionStatusSchema,
	toApiMemberRole
} from '$lib/server/api/statuses';

/** Equipo y plan de la tienda. Ver `ecommerce-api/src/modules/team` y `platform`. */

const memberSchema = z
	.object({
		userId: z.string(),
		email: z.string(),
		fullName: z.string().nullable(),
		role: memberRoleSchema,
		joinedAt: z.string()
	})
	.transform((member): TeamMember => ({
		user_id: member.userId,
		email: member.email,
		full_name: member.fullName,
		role: member.role,
		joined_at: member.joinedAt
	}));

const invitationSchema = z
	.object({
		id: z.string(),
		email: z.string(),
		role: memberRoleSchema,
		invitedBy: z.string().nullable(),
		expiresAt: z.string(),
		createdAt: z.string()
	})
	.transform((invitation): TeamInvitation => ({
		id: invitation.id,
		email: invitation.email,
		role: invitation.role,
		invited_by: invitation.invitedBy,
		expires_at: invitation.expiresAt,
		created_at: invitation.createdAt
	}));

export function listMembers(ctx: PanelContext): Promise<ApiResult<TeamMember[]>> {
	return panelRequest(ctx, '/members', z.array(memberSchema));
}

export function changeMemberRole(
	ctx: PanelContext,
	userId: string,
	role: MemberRole
): Promise<ApiResult<TeamMember[]>> {
	return panelRequest(ctx, `/members/${segment(userId)}`, z.array(memberSchema), {
		method: 'PATCH',
		body: { role: toApiMemberRole(role) }
	});
}

export function removeMember(ctx: PanelContext, userId: string): Promise<ApiResult<undefined>> {
	return panelRequest(ctx, `/members/${segment(userId)}`, z.undefined(), { method: 'DELETE' });
}

export function listInvitations(ctx: PanelContext): Promise<ApiResult<TeamInvitation[]>> {
	return panelRequest(ctx, '/invitations', z.array(invitationSchema));
}

export function invite(
	ctx: PanelContext,
	email: string,
	role: MemberRole
): Promise<ApiResult<TeamInvitation>> {
	return panelRequest(ctx, '/invitations', invitationSchema, {
		method: 'POST',
		body: { email, role: toApiMemberRole(role) }
	});
}

export function revokeInvitation(ctx: PanelContext, id: string): Promise<ApiResult<undefined>> {
	return panelRequest(ctx, `/invitations/${segment(id)}`, z.undefined(), { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

export const planSchema = z
	.object({
		code: z.string(),
		name: z.string(),
		priceCop: z.number(),
		maxProducts: z.number().nullable(),
		maxOrdersPerMonth: z.number().nullable(),
		maxImagesPerProduct: z.number().nullable(),
		customDomain: z.boolean(),
		aiRepliesPerMonth: z.number(),
		active: z.boolean()
	})
	.transform((plan): Plan => ({
		code: plan.code,
		name: plan.name,
		price_cop: plan.priceCop,
		max_products: plan.maxProducts,
		max_orders_per_month: plan.maxOrdersPerMonth,
		max_images_per_product: plan.maxImagesPerProduct,
		custom_domain: plan.customDomain,
		ai_replies_per_month: plan.aiRepliesPerMonth,
		active: plan.active
	}));

const storePaymentSchema = z
	.object({
		id: z.string(),
		amountCop: z.number(),
		periodStart: z.string(),
		periodEnd: z.string(),
		method: z.string(),
		createdAt: z.string()
	})
	.transform((payment): StorePayment => ({
		id: payment.id,
		amount_cop: payment.amountCop,
		period_start: payment.periodStart,
		period_end: payment.periodEnd,
		method: payment.method,
		created_at: payment.createdAt
	}));

const paymentMethodSchema = z.object({
	connected: z.boolean(),
	brand: z.string().nullable(),
	last4: z.string().nullable()
});

const subscriptionSchema = z
	.object({
		plan: planSchema,
		status: subscriptionStatusSchema,
		storeStatus: storeStatusSchema,
		currentPeriodEnd: z.string(),
		trialEndsAt: z.string().nullable(),
		daysLeft: z.number(),
		usage: z.object({ products: z.number(), ordersThisMonth: z.number() }),
		selfServiceBilling: z.boolean(),
		paymentMethod: paymentMethodSchema,
		payments: z.array(storePaymentSchema)
	})
	.transform((summary): SubscriptionSummary => ({
		plan: summary.plan,
		status: summary.status,
		store_status: summary.storeStatus,
		current_period_end: summary.currentPeriodEnd,
		trial_ends_at: summary.trialEndsAt,
		days_left: summary.daysLeft,
		usage: {
			products: summary.usage.products,
			orders_this_month: summary.usage.ordersThisMonth
		},
		self_service_billing: summary.selfServiceBilling,
		payment_method: summary.paymentMethod,
		payments: summary.payments
	}));

export function getSubscription(ctx: PanelContext): Promise<ApiResult<SubscriptionSummary>> {
	return panelRequest(ctx, '/subscription', subscriptionSchema);
}

/**
 * Guarda la tarjeta con que se cobrará el plan.
 *
 * Lo que viaja es un token hecho en el navegador, nunca la tarjeta: el número
 * no pasa ni por este servidor ni por la API. Guardarla no cobra nada; el
 * primer cobro es el día que termina la prueba.
 */
export function savePaymentMethod(
	ctx: PanelContext,
	keys: { cardToken: string; acceptanceToken: string }
): Promise<ApiResult<PaymentMethod>> {
	return panelRequest(ctx, '/subscription/payment-method', paymentMethodSchema, {
		method: 'PUT',
		body: keys
	});
}

/** Deja de cobrar solo. Lo ya pagado se respeta. */
export function removePaymentMethod(ctx: PanelContext): Promise<ApiResult<PaymentMethod>> {
	return panelRequest(ctx, '/subscription/payment-method', paymentMethodSchema, {
		method: 'DELETE'
	});
}

export interface SubscriptionCheckout {
	url: string;
	reference: string;
	amount_cop: number;
}

const checkoutSchema = z
	.object({ url: z.string().url(), reference: z.string(), amountCop: z.number() })
	.transform((body): SubscriptionCheckout => ({
		url: body.url,
		reference: body.reference,
		amount_cop: body.amountCop
	}));

/**
 * Empieza el cobro del plan y devuelve a dónde ir a pagar.
 *
 * Lo que pone el plan al día no es volver de esa página, sino el evento que la
 * pasarela le manda a la API. Acá solo se consigue el enlace.
 */
export function checkoutSubscription(
	ctx: PanelContext,
	planCode: string
): Promise<ApiResult<SubscriptionCheckout>> {
	return panelRequest(ctx, '/subscription/checkout', checkoutSchema, {
		method: 'POST',
		body: { planCode }
	});
}
