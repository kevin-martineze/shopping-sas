import type { StorefrontDraft } from '$lib/storefront-draft';

import { describe, expect, it } from 'vitest';

import { EMPTY_THEME } from '$lib/domain/theme';
import { DRAFT_READY, draftMessage, isReadyMessage, readDraftMessage } from '$lib/storefront-draft';

describe('mensajes del borrador', () => {
	it('lo que manda el editor se lee igual en la tienda', () => {
		const draft: StorefrontDraft = {
			template: 'noche',
			theme: { ...EMPTY_THEME, accent: '#E0A458', hero: 'split' }
		};

		expect(readDraftMessage(draftMessage(draft))).toEqual(draft);
	});

	it('ignora lo que no es un borrador, o una plantilla que no existe', () => {
		expect(readDraftMessage('hola')).toBeNull();
		expect(readDraftMessage({ type: 'otro', template: 'noche' })).toBeNull();
		expect(readDraftMessage({ type: 'globerce:borrador', template: 'inventada' })).toBeNull();
	});

	it('un ajuste desconocido llega como el de la plantilla', () => {
		expect(
			readDraftMessage({
				type: 'globerce:borrador',
				template: 'galeria',
				theme: { accent: 'url(javascript:1)', fonts: 'serif' }
			})
		).toEqual({ template: 'galeria', theme: { ...EMPTY_THEME, fonts: 'serif' } });
	});

	it('reconoce el aviso de que la tienda está lista', () => {
		expect(isReadyMessage({ type: DRAFT_READY })).toBe(true);
		expect(isReadyMessage(null)).toBe(false);
	});
});
