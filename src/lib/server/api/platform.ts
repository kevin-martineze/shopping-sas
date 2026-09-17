import type {
	Plan,
	PlatformPayment,
	PlatformStore,
	PlatformStoreDetail,
	StoreStatus
} from '$lib/domain/account';
import type { ApiResult } from '$lib/server/api/client';
import type { AccountContext } from '$lib/server/context';

import { z } from 'zod';

import { apiRequest } from '$lib/server/api/client';
import { planSchema } from '$lib/server/api/panel-team';
import {
	memberRoleSchema,
	storeStatusSchema,
	subscriptionStatusSchema
} from '$lib/server/api/statuses';

/** Consola de la plataforma: `/platform/*`. Solo para cuentas en `platform_admins`. */

const storeFields = {
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	customDomain: z.string().nullable(),
	status: storeStatusSchema,
	trialEndsAt: z.string().nullable(),
	createdAt: z.string(),
	planCode: z.string().nullable(),
	subscriptionStatus: subscriptionStatusSchema.nullable(),
	currentPeriodEnd: z.string().nullable(),
	members: z.array(
		z.object({
			userId: z.string(),
			email: z.string(),
			fullName: z.string().nullable(),
			role: memberRoleSchema
		})
	),
	productCount: z.number(),
	orderCount: z.number()
};

type RawStore = z.output<z.ZodObject<typeof storeFields>>;

function toStore(store: RawStore): PlatformStore {
	return {
		id: store.id,
		name: store.name,
		slug: store.slug,
		custom_domain: store.customDomain,
		status: store.status,
		trial_ends_at: store.trialEndsAt,
		created_at: store.createdAt,
		plan_code: store.planCode,
		subscription_status: store.subscriptionStatus,
		current_period_end: store.currentPeriodEnd,
		members: store.members.map((member) => ({
			user_id: member.userId,
			email: member.email,
			full_name: member.fullName,
			role: member.role
		})),
		product_count: store.productCount,
		order_count: store.orderCount
	};
}

const storeSchema = z.object(storeFields).transform(toStore);

const paymentSchema = z
	.object({
		id: z.string(),
		amountCop: z.number(),
		periodStart: z.string(),
		periodEnd: z.string(),
		method: z.string(),
		reference: z.string().nullable(),
		recordedBy: z.string().nullable(),
		createdAt: z.string()
	})
	.transform((payment): PlatformPayment => ({
		id: payment.id,
		amount_cop: payment.amountCop,
		period_start: payment.periodStart,
		period_end: payment.periodEnd,
		method: payment.method,
		reference: payment.reference,
		recorded_by: payment.recordedBy,
		created_at: payment.createdAt
	}));

const storeDetailSchema = z
	.object({
		...storeFields,
		subscriptionNotes: z.string().nullable(),
		payments: z.array(paymentSchema)
	})
	.transform((store): PlatformStoreDetail => ({
		...toStore(store),
		subscription_notes: store.subscriptionNotes,
		payments: store.payments
	}));

function platformRequest<T>(
	ctx: AccountContext,
	path: string,
	schema: z.ZodType<T, z.ZodTypeDef, unknown>,
	options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH'; body?: unknown } = {}
): Promise<ApiResult<T>> {
	return apiRequest(`/platform${path}`, schema, {
		...options,
		accessToken: ctx.accessToken,
		clientIp: ctx.clientIp
	});
}

export function listPlans(ctx: AccountContext): Promise<ApiResult<Plan[]>> {
	return platformRequest(ctx, '/plans', z.array(planSchema));
}

export interface StoreFilters {
	q: string | null;
	status: StoreStatus | null;
	overdue: boolean;
}

const STATUS_TO_API: Record<StoreStatus, string> = {
	trial: 'TRIAL',
	active: 'ACTIVE',
	past_due: 'PAST_DUE',
	suspended: 'SUSPENDED'
};

export function listStores(
	ctx: AccountContext,
	filters: StoreFilters
): Promise<ApiResult<PlatformStore[]>> {
	const params = new URLSearchParams();

	if (filters.q) params.set('q', filters.q);
	if (filters.status) params.set('status', STATUS_TO_API[filters.status]);
	if (filters.overdue) params.set('overdue', 'true');

	const query = params.size > 0 ? `?${params}` : '';

	return platformRequest(ctx, `/stores${query}`, z.array(storeSchema));
}

export function getStore(ctx: AccountContext, id: string): Promise<ApiResult<PlatformStoreDetail>> {
	return platformRequest(ctx, `/stores/${encodeURIComponent(id)}`, storeDetailSchema);
}

export function setStoreStatus(
	ctx: AccountContext,
	id: string,
	status: 'active' | 'suspended'
): Promise<ApiResult<PlatformStoreDetail>> {
	return platformRequest(ctx, `/stores/${encodeURIComponent(id)}/status`, storeDetailSchema, {
		method: 'PATCH',
		body: { status: status === 'active' ? 'ACTIVE' : 'SUSPENDED' }
	});
}

export function changePlan(
	ctx: AccountContext,
	id: string,
	planCode: string,
	notes: string | null
): Promise<ApiResult<PlatformStoreDetail>> {
	return platformRequest(ctx, `/stores/${encodeURIComponent(id)}/plan`, storeDetailSchema, {
		method: 'PUT',
		body: { planCode, notes }
	});
}

export interface PaymentInput {
	amountCop: number;
	periodStart: string;
	periodEnd: string;
	method: string;
	reference: string | null;
}

export function recordPayment(
	ctx: AccountContext,
	id: string,
	input: PaymentInput
): Promise<ApiResult<PlatformStoreDetail>> {
	return platformRequest(ctx, `/stores/${encodeURIComponent(id)}/payments`, storeDetailSchema, {
		method: 'POST',
		body: input
	});
}

export function reconcile(ctx: AccountContext): Promise<ApiResult<{ markedPastDue: number }>> {
	return platformRequest(ctx, '/reconcile', z.object({ markedPastDue: z.number() }), {
		method: 'POST'
	});
}
