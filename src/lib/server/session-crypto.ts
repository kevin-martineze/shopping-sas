import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

/**
 * Sellado de la sesión del panel dentro de una cookie.
 *
 * La API entrega los tokens en el cuerpo de la respuesta y quien los guarda es
 * este servidor, en una cookie httpOnly de su propio dominio. Se CIFRAN y no
 * solo se firman: una firma impide falsificarlos, pero los dejaría legibles
 * para cualquiera que vea la cookie —una extensión del navegador, el log de un
 * proxy—. Cifrados, el navegador guarda un valor opaco.
 *
 * AES-256-GCM cifra y autentica a la vez: una cookie alterada no descifra a
 * basura, falla. No hace falta una firma aparte.
 *
 * Son funciones puras, sin `$env` ni cookies, para probarlas sin SvelteKit.
 */

export const adminSessionSchema = z.object({
	accessToken: z.string().min(1),
	refreshToken: z.string().min(1),
	/** Epoch en milisegundos en que vence el access token. */
	accessExpiresAt: z.number().int(),
	userId: z.string(),
	email: z.string(),
	/**
	 * Tienda activa. Null solo para una cuenta que administra la plataforma sin
	 * pertenecer a ninguna tienda: entra a `/plataforma`, nunca al panel.
	 */
	storeId: z.string().nullable()
});

export type AdminSession = z.infer<typeof adminSessionSchema>;

/** Se refresca con este margen antes del vencimiento, para no mandar a la API un token que muere en vuelo. */
export const REFRESH_MARGIN_MS = 60_000;

const IV_BYTES = 12;
const TAG_BYTES = 16;

/** Hashear el secreto da exactamente los 32 bytes que pide AES-256, sea cual sea su largo. */
function keyFrom(secret: string): Buffer {
	return createHash('sha256').update(secret).digest();
}

export function sealSession(session: AdminSession, secret: string): string {
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv('aes-256-gcm', keyFrom(secret), iv);
	const encrypted = Buffer.concat([cipher.update(JSON.stringify(session), 'utf8'), cipher.final()]);

	return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

/** La sesión, o null si la cookie no es de este servidor, fue alterada o tiene otra forma. */
export function unsealSession(value: string, secret: string): AdminSession | null {
	try {
		const raw = Buffer.from(value, 'base64url');

		if (raw.length <= IV_BYTES + TAG_BYTES) return null;

		const decipher = createDecipheriv('aes-256-gcm', keyFrom(secret), raw.subarray(0, IV_BYTES));
		decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));

		const json = Buffer.concat([
			decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)),
			decipher.final()
		]).toString('utf8');

		const decoded: unknown = JSON.parse(json);
		const parsed = adminSessionSchema.safeParse(decoded);

		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

export function needsRefresh(session: AdminSession, now: number): boolean {
	return session.accessExpiresAt - now <= REFRESH_MARGIN_MS;
}
