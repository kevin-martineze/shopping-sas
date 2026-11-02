/**
 * Centro de soporte: lo que la dueña y el equipo ven de un caso.
 *
 * Los estados se guardan en inglés, igual que la API, y se traducen al pintarlos.
 */

export const SUPPORT_CATEGORIES = [
	'CONFIGURATION',
	'DOMAIN',
	'PAYMENTS',
	'PLAN',
	'PRODUCTS_ORDERS',
	'ERROR',
	'OTHER'
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export const SUPPORT_STATUSES = ['OPEN', 'ANSWERED', 'CLOSED'] as const;

export type SupportStatus = (typeof SUPPORT_STATUSES)[number];

/** `OWNER`: la dueña de la tienda. `TEAM`: el equipo de Globerce. */
export type SupportAuthor = 'OWNER' | 'TEAM';

export const SUPPORT_CATEGORY_LABEL: Record<SupportCategory, string> = {
	CONFIGURATION: 'Configuración',
	DOMAIN: 'Dominio',
	PAYMENTS: 'Pagos',
	PLAN: 'Plan y facturación',
	PRODUCTS_ORDERS: 'Productos y pedidos',
	ERROR: 'Algo no funciona',
	OTHER: 'Otra cosa'
};

export const SUPPORT_STATUS_LABEL: Record<SupportStatus, string> = {
	OPEN: 'Abierto',
	ANSWERED: 'Respondido',
	CLOSED: 'Cerrado'
};

export interface SupportMessage {
	id: string;
	author: SupportAuthor;
	body: string;
	created_at: string;
}

/** Vista de la dueña. */
export interface SupportTicket {
	id: string;
	subject: string;
	category: SupportCategory;
	status: SupportStatus;
	created_at: string;
	last_message_at: string;
	/** Respuestas del equipo que la dueña todavía no abrió. */
	unread_replies: number;
}

export interface SupportList {
	tickets: SupportTicket[];
	unread_replies: number;
}

export interface SupportThread {
	ticket: SupportTicket;
	messages: SupportMessage[];
}

/** Vista del equipo: añade la tienda, quién abrió el caso y desde cuándo espera. */
export interface PlatformSupportTicket {
	id: string;
	store_id: string;
	store_name: string;
	store_slug: string;
	subject: string;
	category: SupportCategory;
	status: SupportStatus;
	created_at: string;
	last_message_at: string;
	/** Null si el caso no espera al equipo. */
	waiting_since: string | null;
	opened_by_email: string | null;
	unread_from_owner: number;
}

export interface PlatformSupportList {
	tickets: PlatformSupportTicket[];
	total: number;
	page: number;
	page_size: number;
}

export interface PlatformSupportThread {
	ticket: PlatformSupportTicket;
	messages: SupportMessage[];
}

/**
 * Cuánto lleva esperando un caso, en palabras cortas para la bandeja.
 *
 * `now` se pasa para que la función sea pura y se pueda probar con fechas fijas.
 */
export function esperaDesde(iso: string, now: Date = new Date()): string {
	const minutes = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));

	if (minutes < 60) return `hace ${minutes} min`;

	const hours = Math.floor(minutes / 60);

	if (hours < 24) return `hace ${hours} h`;

	const days = Math.floor(hours / 24);

	return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}
