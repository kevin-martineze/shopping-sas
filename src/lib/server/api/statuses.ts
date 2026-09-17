import type { MemberRole, StoreStatus, SubscriptionStatus } from '$lib/domain/account';
import type { ProductStatus } from '$lib/domain/catalog';
import type { OrderStatus } from '$lib/domain/orders';

import { z } from 'zod';

/**
 * La API nombra los estados en mayúsculas (`ACTIVE`); el dominio del frontend
 * los guarda en minúsculas, como estaban en Supabase. Se traduce solo aquí.
 */

type ApiProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
type ApiOrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const PRODUCT_TO_DOMAIN: Record<ApiProductStatus, ProductStatus> = {
	DRAFT: 'draft',
	ACTIVE: 'active',
	ARCHIVED: 'archived'
};

const PRODUCT_TO_API: Record<ProductStatus, ApiProductStatus> = {
	draft: 'DRAFT',
	active: 'ACTIVE',
	archived: 'ARCHIVED'
};

const ORDER_TO_DOMAIN: Record<ApiOrderStatus, OrderStatus> = {
	PENDING: 'pending',
	CONFIRMED: 'confirmed',
	SHIPPED: 'shipped',
	DELIVERED: 'delivered',
	CANCELLED: 'cancelled'
};

const ORDER_TO_API: Record<OrderStatus, ApiOrderStatus> = {
	pending: 'PENDING',
	confirmed: 'CONFIRMED',
	shipped: 'SHIPPED',
	delivered: 'DELIVERED',
	cancelled: 'CANCELLED'
};

export const productStatusSchema = z
	.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'])
	.transform((status) => PRODUCT_TO_DOMAIN[status]);

export const orderStatusSchema = z
	.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
	.transform((status) => ORDER_TO_DOMAIN[status]);

export function toApiProductStatus(status: ProductStatus): ApiProductStatus {
	return PRODUCT_TO_API[status];
}

export function toApiOrderStatus(status: OrderStatus): ApiOrderStatus {
	return ORDER_TO_API[status];
}

type ApiMemberRole = 'OWNER' | 'STAFF';

const ROLE_TO_API: Record<MemberRole, ApiMemberRole> = { owner: 'OWNER', staff: 'STAFF' };

export const memberRoleSchema = z
	.enum(['OWNER', 'STAFF'])
	.transform((role): MemberRole => (role === 'OWNER' ? 'owner' : 'staff'));

export function toApiMemberRole(role: MemberRole): ApiMemberRole {
	return ROLE_TO_API[role];
}

const STORE_STATUS_TO_DOMAIN: Record<'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED', StoreStatus> = {
	TRIAL: 'trial',
	ACTIVE: 'active',
	PAST_DUE: 'past_due',
	SUSPENDED: 'suspended'
};

export const storeStatusSchema = z
	.enum(['TRIAL', 'ACTIVE', 'PAST_DUE', 'SUSPENDED'])
	.transform((status) => STORE_STATUS_TO_DOMAIN[status]);

const SUBSCRIPTION_STATUS_TO_DOMAIN: Record<
	'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED',
	SubscriptionStatus
> = {
	TRIALING: 'trialing',
	ACTIVE: 'active',
	PAST_DUE: 'past_due',
	CANCELLED: 'cancelled'
};

export const subscriptionStatusSchema = z
	.enum(['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED'])
	.transform((status) => SUBSCRIPTION_STATUS_TO_DOMAIN[status]);
