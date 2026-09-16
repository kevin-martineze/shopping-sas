import type { AdminSession } from '$lib/server/session-crypto';

import { describe, expect, it } from 'vitest';

import {
	REFRESH_MARGIN_MS,
	needsRefresh,
	sealSession,
	unsealSession
} from '$lib/server/session-crypto';

const secret = 'un-secreto-de-prueba-con-largo-suficiente';

const session: AdminSession = {
	accessToken: 'header.payload.firma',
	refreshToken: 'refresh-token-opaco',
	accessExpiresAt: 1_800_000_000_000,
	userId: 'user-1',
	email: 'duena@tienda.test',
	storeId: 'store-1'
};

describe('sealSession / unsealSession', () => {
	it('recupera exactamente la misma sesión', () => {
		expect(unsealSession(sealSession(session, secret), secret)).toEqual(session);
	});

	it('la cookie no deja leer los tokens', () => {
		const sealed = sealSession(session, secret);

		expect(sealed).not.toContain('refresh-token-opaco');
		expect(Buffer.from(sealed, 'base64url').toString('utf8')).not.toContain('refresh-token-opaco');
	});

	it('sellar dos veces la misma sesión da cookies distintas', () => {
		expect(sealSession(session, secret)).not.toBe(sealSession(session, secret));
	});

	it('rechaza una cookie alterada en un solo carácter', () => {
		const sealed = sealSession(session, secret);
		const index = 20;
		const replacement = sealed[index] === 'A' ? 'B' : 'A';
		const tampered = `${sealed.slice(0, index)}${replacement}${sealed.slice(index + 1)}`;

		expect(unsealSession(tampered, secret)).toBeNull();
	});

	it('rechaza una cookie sellada con otro secreto', () => {
		const sealed = sealSession(session, 'otro-secreto-igual-de-largo-que-el-real');

		expect(unsealSession(sealed, secret)).toBeNull();
	});

	it('rechaza basura sin lanzar', () => {
		expect(unsealSession('no-es-una-cookie', secret)).toBeNull();
		expect(unsealSession('', secret)).toBeNull();
	});
});

describe('needsRefresh', () => {
	const expiresAt = session.accessExpiresAt;

	it('no refresca mientras sobra tiempo', () => {
		expect(needsRefresh(session, expiresAt - REFRESH_MARGIN_MS - 1)).toBe(false);
	});

	it('refresca dentro del margen previo al vencimiento', () => {
		expect(needsRefresh(session, expiresAt - REFRESH_MARGIN_MS + 1)).toBe(true);
	});

	it('refresca si ya venció', () => {
		expect(needsRefresh(session, expiresAt + 1)).toBe(true);
	});
});
