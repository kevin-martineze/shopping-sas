import { z } from 'zod';

import {
	SUPPORT_CATEGORIES,
	SUPPORT_STATUSES,
	type PlatformSupportList,
	type PlatformSupportThread,
	type PlatformSupportTicket,
	type SupportAuthor,
	type SupportList,
	type SupportMessage,
	type SupportThread,
	type SupportTicket
} from '$lib/domain/support';

/**
 * Lo que devuelve el centro de soporte, leído con zod y traducido al dominio.
 *
 * Lo comparten las dos superficies (la dueña y el equipo): la forma de un
 * mensaje y de un caso es la misma, solo cambian los datos de la tienda.
 */

const categorySchema = z.enum(SUPPORT_CATEGORIES);
const statusSchema = z.enum(SUPPORT_STATUSES);
const authorSchema: z.ZodType<SupportAuthor, z.ZodTypeDef, unknown> = z.enum(['OWNER', 'TEAM']);

const messageFields = {
	id: z.string(),
	author: authorSchema,
	body: z.string(),
	createdAt: z.string()
};

export const messageSchema = z.object(messageFields).transform((message): SupportMessage => ({
	id: message.id,
	author: message.author,
	body: message.body,
	created_at: message.createdAt
}));

const ownerTicketSchema = z
	.object({
		id: z.string(),
		subject: z.string(),
		category: categorySchema,
		status: statusSchema,
		createdAt: z.string(),
		lastMessageAt: z.string(),
		unreadReplies: z.number().int().nonnegative()
	})
	.transform((ticket): SupportTicket => ({
		id: ticket.id,
		subject: ticket.subject,
		category: ticket.category,
		status: ticket.status,
		created_at: ticket.createdAt,
		last_message_at: ticket.lastMessageAt,
		unread_replies: ticket.unreadReplies
	}));

export const storeListSchema = z
	.object({
		tickets: z.array(ownerTicketSchema),
		unreadReplies: z.number().int().nonnegative()
	})
	.transform((list): SupportList => ({
		tickets: list.tickets,
		unread_replies: list.unreadReplies
	}));

export const storeThreadSchema = z
	.object({
		ticket: ownerTicketSchema,
		messages: z.array(messageSchema)
	})
	.transform((thread): SupportThread => ({ ticket: thread.ticket, messages: thread.messages }));

const platformTicketSchema = z
	.object({
		id: z.string(),
		storeId: z.string(),
		storeName: z.string(),
		storeSlug: z.string(),
		subject: z.string(),
		category: categorySchema,
		status: statusSchema,
		createdAt: z.string(),
		lastMessageAt: z.string(),
		waitingSince: z.string().nullable(),
		openedByEmail: z.string().nullable(),
		unreadFromOwner: z.number().int().nonnegative()
	})
	.transform((ticket): PlatformSupportTicket => ({
		id: ticket.id,
		store_id: ticket.storeId,
		store_name: ticket.storeName,
		store_slug: ticket.storeSlug,
		subject: ticket.subject,
		category: ticket.category,
		status: ticket.status,
		created_at: ticket.createdAt,
		last_message_at: ticket.lastMessageAt,
		waiting_since: ticket.waitingSince,
		opened_by_email: ticket.openedByEmail,
		unread_from_owner: ticket.unreadFromOwner
	}));

export const platformListSchema = z
	.object({
		tickets: z.array(platformTicketSchema),
		total: z.number().int().nonnegative(),
		page: z.number().int().positive(),
		pageSize: z.number().int().positive()
	})
	.transform((list): PlatformSupportList => ({
		tickets: list.tickets,
		total: list.total,
		page: list.page,
		page_size: list.pageSize
	}));

export const platformThreadSchema = z
	.object({
		ticket: platformTicketSchema,
		messages: z.array(messageSchema)
	})
	.transform((thread): PlatformSupportThread => ({
		ticket: thread.ticket,
		messages: thread.messages
	}));
