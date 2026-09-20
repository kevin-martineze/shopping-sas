import { error, fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { inviteSchema, memberRoleSchema } from '$lib/schemas/account';
import {
	changeMemberRole,
	invite,
	listInvitations,
	listMembers,
	removeMember,
	revokeInvitation
} from '$lib/server/api/panel-team';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ctx = panelContext(event);
	const { role, adminEmail } = await event.parent();

	const [members, invitations] = await Promise.all([
		listMembers(ctx),
		// Solo la dueña ve las invitaciones: al personal la API se las niega.
		role === 'owner' ? listInvitations(ctx) : Promise.resolve(null)
	]);

	return {
		members: orFail(members),
		invitations: invitations ? orFail(invitations) : [],
		canManage: role === 'owner',
		selfEmail: adminEmail
	};
};

function requiredId(formData: FormData, field: string): string {
	const value = String(formData.get(field) ?? '');

	if (!value) error(400, 'Falta indicar a quién.');

	return value;
}

export const actions: Actions = {
	invitar: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const parsed = inviteSchema.safeParse({
			email: formData.get('email'),
			role: formData.get('role')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const result = await invite(ctx, parsed.data.email, parsed.data.role);

		if (!result.ok) return failWith(result);

		return { message: `Enviamos la invitación a ${result.data.email}.` };
	},

	cambiarRol: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const role = memberRoleSchema.safeParse(formData.get('role'));

		if (!role.success) return fail(400, { error: 'Elige un rol.' });

		const result = await changeMemberRole(ctx, requiredId(formData, 'userId'), role.data);

		if (!result.ok) return failWith(result);

		return { message: 'Rol actualizado.' };
	},

	quitar: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const result = await removeMember(ctx, requiredId(formData, 'userId'));

		if (!result.ok) return failWith(result);

		return { message: 'Quitamos a esa persona del equipo.' };
	},

	anular: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const result = await revokeInvitation(ctx, requiredId(formData, 'invitationId'));

		if (!result.ok) return failWith(result);

		return { message: 'Invitación anulada: el enlace ya no sirve.' };
	}
};
