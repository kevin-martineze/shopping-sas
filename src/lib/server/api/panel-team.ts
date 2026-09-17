import type {
	MemberRole,
	Plan,
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
		active: plan.active
	}));

const subscriptionSchema = z
	.object({
		plan: planSchema,
		status: subscriptionStatusSchema,
		storeStatus: storeStatusSchema,
		currentPeriodEnd: z.string(),
		trialEndsAt: z.string().nullable(),
		daysLeft: z.number(),
		usage: z.object({ products: z.number(), ordersThisMonth: z.number() })
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
		}
	}));

export function getSubscription(ctx: PanelContext): Promise<ApiResult<SubscriptionSummary>> {
	return panelRequest(ctx, '/subscription', subscriptionSchema);
}
