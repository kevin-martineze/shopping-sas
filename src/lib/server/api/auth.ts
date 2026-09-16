import type { ApiResult } from '$lib/server/api/client';

import { z } from 'zod';

import { apiRequest } from '$lib/server/api/client';

/**
 * Endpoints de sesión de la API. Ver `ecommerce-api/src/modules/auth`.
 *
 * Todos reenvían la IP de quien hizo la petición: la API limita el login y el
 * refresh por IP, y sin ella todas las dueñas de todas las tiendas compartirían
 * la cuota del servidor de la tienda.
 */

const storeSchema = z.object({
	id: z.string(),
	name: z.string(),
	slug: z.string(),
	role: z.string()
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
	stores: z.array(storeSchema)
});

export type ApiSession = z.infer<typeof sessionSchema>;
export type ApiMe = z.infer<typeof meSchema>;

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
