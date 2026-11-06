import type { DomainStatus } from '$lib/domain/domain';

/**
 * Qué tienda sirve un dominio propio, recordado un rato para no consultar la
 * API en cada página de la tienda.
 *
 * Solo se guardan las respuestas de la API (la tienda encontrada o el 404).
 * Un error de red o un 5xx no se guarda: la siguiente visita vuelve a preguntar.
 */

export interface StoreByDomain {
	slug: string;
	status: DomainStatus;
}

/** Tiempo que se recuerda una tienda encontrada. */
export const TTL_FOUND_MS = 60_000;
/** Tiempo que se recuerda un 404. Corto: la dueña puede acabar de conectar el dominio. */
export const TTL_MISSING_MS = 30_000;
/** Tope de entradas. Al llegar, sale la más antigua. */
export const MAX_ENTRIES = 1000;

interface Entry {
	value: StoreByDomain | null;
	expiresAt: number;
}

const entries = new Map<string, Entry>();

/**
 * Lo que se sabe del host: la tienda, `null` si no existe, o `undefined` si no
 * hay nada guardado o caducó.
 */
export function getCachedDomain(
	host: string,
	now: number = Date.now()
): StoreByDomain | null | undefined {
	const entry = entries.get(host);

	if (!entry) return undefined;

	if (entry.expiresAt <= now) {
		entries.delete(host);
		return undefined;
	}

	return entry.value;
}

/** Guarda la respuesta de la API. `null` significa que el host no tiene tienda. */
export function setCachedDomain(
	host: string,
	value: StoreByDomain | null,
	now: number = Date.now()
): void {
	entries.delete(host);

	if (entries.size >= MAX_ENTRIES) {
		const oldest = entries.keys().next();

		if (!oldest.done) entries.delete(oldest.value);
	}

	entries.set(host, {
		value,
		expiresAt: now + (value ? TTL_FOUND_MS : TTL_MISSING_MS)
	});
}

/** Solo para los tests. */
export function clearDomainCache(): void {
	entries.clear();
}
