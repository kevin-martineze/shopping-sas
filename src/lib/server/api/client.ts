import type { z } from 'zod';

import { serverEnv } from '$lib/server/env';

/**
 * Cliente HTTP de la API propia (`ecommerce-api`).
 *
 * Solo servidor: el navegador nunca habla con la API. Se llama desde
 * `+page.server.ts`, `hooks.server.ts` y form actions.
 *
 * Nunca lanza: devuelve un resultado que el llamador narrowa con `if
 * (!result.ok)`. La respuesta se lee con un esquema zod y no se castea, porque
 * lo que llega por la red es `unknown` hasta que se demuestre lo contrario.
 */

export type ApiResult<T> =
	| { ok: true; data: T }
	| {
			ok: false;
			/** 0 cuando la API ni siquiera respondió. */
			status: number;
			/** Código estable de la API (`not_found`, `out_of_stock`…) para decidir sin leer el texto. */
			code: string;
			/** Mensaje en español, listo para mostrar. */
			message: string;
			/** Detalle que adjunta la API (campos inválidos, prendas agotadas). Se valida donde se usa. */
			details: unknown;
	  };

export type ApiFailure = Extract<ApiResult<unknown>, { ok: false }>;

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
	method?: Method;
	body?: unknown;
	accessToken?: string;
	/**
	 * IP de quien originó la petición. La API limita el login y las escrituras
	 * públicas por IP; sin esto vería la del servidor de la tienda para todas las
	 * visitantes y una sola persona podría agotar la cuota de todas.
	 */
	clientIp?: string | null;
	/** Repetir la petición con la misma clave no repite el efecto (crear un pedido). */
	idempotencyKey?: string;
	/**
	 * Cuerpo multipart (una foto y sus campos). Excluye `body`: `fetch` pone el
	 * content-type con el boundary, y ponerlo a mano lo rompería.
	 */
	formData?: FormData;
}

/** Cualquier esquema cuya salida sea `T`, tenga o no `transform`. */
export type ResponseSchema<T> = z.ZodType<T, z.ZodTypeDef, unknown>;

const UNREACHABLE_MESSAGE = 'No pudimos conectar con el servidor. Intenta de nuevo en un momento.';

export async function apiRequest<T>(
	path: string,
	schema: ResponseSchema<T>,
	options: RequestOptions = {}
): Promise<ApiResult<T>> {
	const headers: Record<string, string> = { accept: 'application/json' };

	if (options.body !== undefined && !options.formData) headers['content-type'] = 'application/json';
	if (options.accessToken) headers.authorization = `Bearer ${options.accessToken}`;
	if (options.clientIp) headers['x-forwarded-for'] = options.clientIp;
	if (options.idempotencyKey) headers['idempotency-key'] = options.idempotencyKey;

	let response: Response;

	try {
		response = await fetch(`${serverEnv().API_URL}${path}`, {
			method: options.method ?? 'GET',
			headers,
			body:
				options.formData ?? (options.body === undefined ? undefined : JSON.stringify(options.body))
		});
	} catch (cause) {
		console.error(
			`La API no respondió en ${path}:`,
			cause instanceof Error ? cause.message : cause
		);
		return {
			ok: false,
			status: 0,
			code: 'unreachable',
			message: UNREACHABLE_MESSAGE,
			details: undefined
		};
	}

	// Un 204 no trae cuerpo, y un error de un proxy puede traer HTML: en los dos
	// casos se sigue con `undefined` y decide el esquema o el status.
	const payload: unknown =
		response.status === 204 ? undefined : await response.json().catch(() => undefined);

	if (!response.ok) {
		return { ok: false, status: response.status, ...readError(response.status, payload) };
	}

	const parsed = schema.safeParse(payload);

	if (!parsed.success) {
		console.error(`Respuesta inesperada de la API en ${path}:`, parsed.error.issues);
		return {
			ok: false,
			status: 502,
			code: 'bad_response',
			message: 'Algo falló de nuestro lado. Intenta de nuevo en un momento.',
			details: undefined
		};
	}

	return { ok: true, data: parsed.data };
}

function readError(
	status: number,
	payload: unknown
): { code: string; message: string; details: unknown } {
	if (status === 429) {
		// El throttler responde en inglés y sin el formato del filtro de la API.
		return {
			code: 'too_many_requests',
			message: 'Demasiados intentos. Espera un minuto.',
			details: undefined
		};
	}

	if (typeof payload === 'object' && payload !== null) {
		const record: Record<string, unknown> = { ...payload };

		if (typeof record.message === 'string') {
			return {
				code: typeof record.error === 'string' ? record.error : 'http_error',
				message: record.message,
				details: record.details
			};
		}
	}

	return {
		code: 'http_error',
		message: status >= 500 ? 'Algo falló de nuestro lado.' : UNREACHABLE_MESSAGE,
		details: undefined
	};
}
