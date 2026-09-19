import type { MemberRole } from '$lib/domain/account';
import type { ApiResult } from '$lib/server/api/client';
import type { AccountContext } from '$lib/server/context';

import { z } from 'zod';

import { apiRequest } from '$lib/server/api/client';
import { memberRoleSchema } from '$lib/server/api/statuses';

/**
 * Endpoints de sesión y cuenta de la API. Ver `ecommerce-api/src/modules/auth`.
 *
 * Todos reenvían la IP de quien hizo la petición: la API limita el login y el
 * refresh por IP, y sin ella todas las dueñas de todas las tiendas compartirían
 * la cuota del servidor de la tienda.
 */

const storeSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	role: memberRoleSchema
});

const userSchema = z.object({
	id: z.string(),
	email: z.string(),
	fullName: z.string().nullable()
});

const sessionSchema = z.object({
	accessToken: z.string().min(1),
	refreshToken: z.string().min(1),
	/** Segundos de validez del access token. */
	expiresIn: z.number().int().positive(),
	user: userSchema,
	stores: z.array(storeSchema),
	/** Tienda a la que está atado el token. Null si la cuenta no es miembro de ninguna. */
	activeStoreId: z.string().nullable()
});

const meSchema = z.object({
	user: userSchema,
	stores: z.array(storeSchema),
	isPlatformAdmin: z.boolean()
});

export type ApiSession = z.infer<typeof sessionSchema>;
export type ApiMe = z.infer<typeof meSchema>;
export type ApiSessionStore = z.infer<typeof storeSchema>;

export function login(
	email: string,
	password: string,
	clientIp: string | null
): Promise<ApiResult<ApiSession>> {
	return apiRequest('/auth/login', sessionSchema, {
		method: 'POST',
		body: { email, password },
		clientIp
	});
}

export interface RegisterInput {
	email: string;
	password: string;
	fullName: string;
	storeName: string;
	storeSlug: string;
	whatsappPhone: string;
	/** El plan que eligió en la página de precios. Sin él, la API pone el básico. */
	planCode?: string;
}

/** Crea la tienda y la cuenta de su dueña. Devuelve la sesión ya iniciada. */
export function register(
	input: RegisterInput,
	clientIp: string | null
): Promise<ApiResult<ApiSession>> {
	return apiRequest('/auth/register', sessionSchema, {
		method: 'POST',
		body: input,
		clientIp
	});
}

/** Otra tienda para la cuenta de la sesión. Devuelve una sesión ya atada a ella. */
export function createStore(
	ctx: AccountContext,
	input: Omit<RegisterInput, 'email' | 'password' | 'fullName'>,
	refreshToken: string
): Promise<ApiResult<ApiSession>> {
	return apiRequest('/auth/stores', sessionSchema, {
		method: 'POST',
		body: { ...input, refreshToken },
		accessToken: ctx.accessToken,
		clientIp: ctx.clientIp
	});
}

export function refresh(
	refreshToken: string,
	clientIp: string | null
): Promise<ApiResult<ApiSession>> {
	return apiRequest('/auth/refresh', sessionSchema, {
		method: 'POST',
		body: { refreshToken },
		clientIp
	});
}

/** Emite una sesión atada a otra tienda de la misma cuenta. La anterior queda anulada. */
export function switchStore(
	ctx: AccountContext,
	storeId: string,
	refreshToken: string
): Promise<ApiResult<ApiSession>> {
	return apiRequest('/auth/switch-store', sessionSchema, {
		method: 'POST',
		body: { storeId, refreshToken },
		accessToken: ctx.accessToken,
		clientIp: ctx.clientIp
	});
}

export function me(accessToken: string, clientIp: string | null): Promise<ApiResult<ApiMe>> {
	return apiRequest('/auth/me', meSchema, { accessToken, clientIp });
}

export function logout(
	refreshToken: string,
	clientIp: string | null
): Promise<ApiResult<undefined>> {
	return apiRequest('/auth/logout', z.undefined(), {
		method: 'POST',
		body: { refreshToken },
		clientIp
	});
}

// ---------------------------------------------------------------------------
// Contraseña
// ---------------------------------------------------------------------------

/** La API responde igual exista o no la cuenta. */
export function forgotPassword(
	email: string,
	clientIp: string | null
): Promise<ApiResult<undefined>> {
	return apiRequest('/auth/password/forgot', z.undefined(), {
		method: 'POST',
		body: { email },
		clientIp
	});
}

/** Fija la contraseña con el enlace del correo. Cierra todas las sesiones de la cuenta. */
export function resetPassword(
	token: string,
	password: string,
	clientIp: string | null
): Promise<ApiResult<undefined>> {
	return apiRequest('/auth/password/reset', z.undefined(), {
		method: 'POST',
		body: { token, password },
		clientIp
	});
}

/** Esta sesión sigue viva; las demás de la cuenta se cierran. */
export function changePassword(
	ctx: AccountContext,
	input: { currentPassword: string; newPassword: string; refreshToken: string }
): Promise<ApiResult<undefined>> {
	return apiRequest('/auth/password/change', z.undefined(), {
		method: 'POST',
		body: input,
		accessToken: ctx.accessToken,
		clientIp: ctx.clientIp
	});
}

// ---------------------------------------------------------------------------
// Invitaciones
// ---------------------------------------------------------------------------

export interface InvitationPreview {
	store_name: string;
	store_slug: string;
	email: string;
	role: MemberRole;
	account_exists: boolean;
	expires_at: string;
}

const invitationPreviewSchema = z
	.object({
		storeName: z.string(),
		storeSlug: z.string(),
		email: z.string(),
		role: memberRoleSchema,
		accountExists: z.boolean(),
		expiresAt: z.string()
	})
	.transform((preview): InvitationPreview => ({
		store_name: preview.storeName,
		store_slug: preview.storeSlug,
		email: preview.email,
		role: preview.role,
		account_exists: preview.accountExists,
		expires_at: preview.expiresAt
	}));

export function previewInvitation(
	token: string,
	clientIp: string | null
): Promise<ApiResult<InvitationPreview>> {
	return apiRequest(`/auth/invitations/${encodeURIComponent(token)}`, invitationPreviewSchema, {
		clientIp
	});
}

export function acceptInvitation(
	input: { token: string; password: string; fullName?: string },
	clientIp: string | null
): Promise<ApiResult<ApiSession>> {
	return apiRequest('/auth/invitations/accept', sessionSchema, {
		method: 'POST',
		body: input,
		clientIp
	});
}
