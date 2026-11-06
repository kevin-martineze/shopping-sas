import { z } from 'zod';

/**
 * El dominio que pega la dueña, en forma de host: sin protocolo, sin ruta, en
 * minúsculas y sin punto final. `https://www.Mitienda.com/ruta/` → `www.mitienda.com`.
 */
export function limpiarDominio(raw: string): string {
	return raw
		.trim()
		.toLowerCase()
		.replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
		.split(/[/?#]/)[0]
		.replace(/\.$/, '');
}

const HOSTNAME = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const IPV4 = /^\d{1,3}(?:\.\d{1,3}){3}$/;

/**
 * Valida el dominio de una tienda. Sin `rootDomain` (instalación de una sola
 * tienda) no hay de quién protegerse, así que solo se valida el formato.
 *
 * Se limpia y se valida en el servidor, aunque el campo tenga `required`.
 */
export function dominioSchema(rootDomain: string | undefined) {
	const root = rootDomain?.trim().toLowerCase().replace(/:\d+$/, '') || undefined;

	return z
		.string()
		.transform(limpiarDominio)
		.superRefine((host, ctx) => {
			const problema = (message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, message });

			if (host === '') return problema('Escribe el dominio, por ejemplo www.mitienda.com.');
			if (host.length > 253) return problema('Ese dominio es demasiado largo.');
			if (IPV4.test(host)) return problema('Usa un nombre de dominio, no una dirección IP.');
			if (host === 'localhost' || host.endsWith('.localhost')) {
				return problema('Ese dominio no se puede usar.');
			}
			if (host === 'vercel.app' || host.endsWith('.vercel.app')) {
				return problema('Ese dominio no se puede usar.');
			}
			if (!host.includes('.')) return problema('Falta la extensión, por ejemplo .com.');
			if (!HOSTNAME.test(host)) {
				return problema('Ese dominio no es válido. Revísalo y vuelve a intentar.');
			}
			if (root && (host === root || host.endsWith(`.${root}`))) {
				return problema('Ese dominio es de Globerce. Usa uno tuyo, por ejemplo www.mitienda.com.');
			}
		});
}
