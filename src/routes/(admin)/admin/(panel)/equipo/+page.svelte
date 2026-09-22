<script lang="ts">
	import { tick } from 'svelte';

	import Trash2 from '@lucide/svelte/icons/trash-2';

	import { enhance } from '$app/forms';

	import type { ActionData, PageData } from './$types';
	import { Badge } from '$lib/components/atoms/badge';
	import { Button } from '$lib/components/atoms/button';
	import { Input } from '$lib/components/atoms/input';
	import { Label } from '$lib/components/atoms/label';
	import * as Table from '$lib/components/atoms/table';
	import FormFeedback from '$lib/components/molecules/FormFeedback.svelte';
	import SelectField from '$lib/components/molecules/SelectField.svelte';
	import { MEMBER_ROLE_LABEL } from '$lib/domain/account';

	interface Props {
		data: PageData;
		form: ActionData;
	}

	let { data, form }: Props = $props();

	let submitting = $state(false);

	const roleOptions = [
		{ value: 'staff', label: 'Personal: catálogo y pedidos' },
		{ value: 'owner', label: 'Creador: todo, incluido el equipo' }
	];

	const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });

	/** El select no es un input nativo: se espera a que actualice su campo oculto y se envía. */
	async function submitRoleFor(userId: string): Promise<void> {
		await tick();
		document.getElementById(`role-submit-${userId}`)?.click();
	}
</script>

<svelte:head>
	<title>Equipo — Globerce</title>
</svelte:head>

<header class="mb-6">
	<h1 class="text-3xl">Equipo</h1>
	<p class="text-muted-foreground text-sm">
		Quiénes administran la tienda. El personal maneja catálogo y pedidos; solo las dueñas gestionan
		el equipo.
	</p>
</header>

<FormFeedback
	error={form?.error ?? null}
	message={form && 'message' in form ? (form.message ?? null) : null}
/>

{#if data.canManage}
	<section class="border-border bg-card rounded-lg mb-8 border p-6">
		<h2 class="mb-4 text-lg">Invitar a alguien</h2>

		<form
			method="POST"
			action="?/invitar"
			class="grid gap-4 sm:grid-cols-[1fr_16rem_auto] sm:items-end"
			use:enhance={() => {
				submitting = true;

				return async ({ update }) => {
					await update();
					submitting = false;
				};
			}}
		>
			<div class="space-y-2">
				<Label for="email">Correo</Label>
				<Input id="email" name="email" type="email" required placeholder="ayudante@correo.com" />
			</div>

			<div class="space-y-2">
				<Label for="role">Rol</Label>
				<SelectField id="role" name="role" value="staff" options={roleOptions} />
			</div>

			<Button type="submit" disabled={submitting}>
				{submitting ? 'Enviando…' : 'Enviar invitación'}
			</Button>
		</form>

		<p class="text-muted-foreground mt-3 text-xs">
			Le llega un enlace por correo que vence en 7 días. Si ya tiene cuenta, entra con su contraseña
			de siempre.
		</p>
	</section>
{/if}

<section class="border-border bg-card mb-8 overflow-hidden rounded-lg border">
	<Table.Root class="table-stack">
		<Table.Header>
			<Table.Row>
				<Table.Head>Persona</Table.Head>
				<Table.Head>Rol</Table.Head>
				<Table.Head>Desde</Table.Head>
				{#if data.canManage}
					<Table.Head></Table.Head>
				{/if}
			</Table.Row>
		</Table.Header>

		<Table.Body>
			{#each data.members as member (member.user_id)}
				{@const isSelf = member.email === data.selfEmail}
				<Table.Row>
					<Table.Cell data-label="Persona">
						<p>{member.full_name ?? member.email}</p>
						<p class="text-muted-foreground text-xs">
							{member.email}{isSelf ? ' · tú' : ''}
						</p>
					</Table.Cell>

					<Table.Cell data-label="Rol">
						{#if data.canManage}
							<form method="POST" action="?/cambiarRol" use:enhance class="w-44">
								<input type="hidden" name="userId" value={member.user_id} />
								<SelectField
									name="role"
									value={member.role}
									aria-label={`Rol de ${member.email}`}
									options={[
										{ value: 'staff', label: MEMBER_ROLE_LABEL.staff },
										{ value: 'owner', label: MEMBER_ROLE_LABEL.owner }
									]}
									onValueChange={() => submitRoleFor(member.user_id)}
								/>
								<button type="submit" class="sr-only" id={`role-submit-${member.user_id}`}>
									Guardar rol
								</button>
							</form>
						{:else}
							<Badge variant="secondary">{MEMBER_ROLE_LABEL[member.role]}</Badge>
						{/if}
					</Table.Cell>

					<Table.Cell data-label="Desde">
						{dateFormatter.format(new Date(member.joined_at))}
					</Table.Cell>

					{#if data.canManage}
						<Table.Cell class="text-right">
							<form method="POST" action="?/quitar" use:enhance>
								<input type="hidden" name="userId" value={member.user_id} />
								<Button
									type="submit"
									variant="ghost"
									size="icon"
									aria-label={`Quitar a ${member.email}`}
									onclick={(event) => {
										if (!confirm(`¿Quitar a ${member.email} del equipo?`)) event.preventDefault();
									}}
								>
									<Trash2 class="size-4" />
								</Button>
							</form>
						</Table.Cell>
					{/if}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</section>

{#if data.canManage && data.invitations.length > 0}
	<section class="border-border bg-card overflow-hidden rounded-lg border">
		<h2 class="border-border border-b px-4 py-3 text-lg">Invitaciones pendientes</h2>

		<Table.Root class="table-stack">
			<Table.Body>
				{#each data.invitations as invitation (invitation.id)}
					<Table.Row>
						<Table.Cell data-label="Correo">{invitation.email}</Table.Cell>
						<Table.Cell data-label="Rol">{MEMBER_ROLE_LABEL[invitation.role]}</Table.Cell>
						<Table.Cell data-label="Vence">
							Vence el {dateFormatter.format(new Date(invitation.expires_at))}
						</Table.Cell>
						<Table.Cell class="text-right">
							<form method="POST" action="?/anular" use:enhance>
								<input type="hidden" name="invitationId" value={invitation.id} />
								<Button type="submit" variant="outline" size="sm">Anular</Button>
							</form>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</section>
{/if}
