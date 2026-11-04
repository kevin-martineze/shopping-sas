import type { StorefrontDraft } from '$lib/storefront-draft';

import { describe, expect, it } from 'vitest';

import { EMPTY_THEME } from '$lib/domain/theme';
import { DRAFT_READY, draftMessage, isReadyMessage, readDraftMessage } from '$lib/storefront-draft';

describe('mensajes del borrador', () => {
	it('lo que manda el editor se lee igual en la tienda', () => {
		const draft: StorefrontDraft = {
			template: 'noche',
			theme: { ...EMPTY_THEME, accent: '#E0A458', hero: 'split' },
			content: {
				kind: 'home',
				heroCollectionId: null,
				heroTitle: 'Recién llegado',
				heroSubtitle: 'Lo nuevo de la temporada',
				highlights: [
					{
						id: 'uno',
						eyebrow: 'Hecho a mano',
						title: 'Piezas únicas',
						body: 'Cada una lleva su tiempo.',
						sortOrder: 1,
						active: true
					}
				]
			},
			focus: 'hero'
		};

		expect(readDraftMessage(draftMessage(draft))).toEqual(draft);
	});

	it('una foto elegida viaja como Blob y se conserva', () => {
		const image = new Blob(['foto'], { type: 'image/png' });
		const draft: StorefrontDraft = {
			template: 'editorial',
			theme: EMPTY_THEME,
			content: {
				kind: 'product',
				name: 'Camisa lino',
				slug: 'camisa-lino',
				description: 'Liviana para el calor.',
				categoryId: null,
				basePrice: 89000,
				compareAtPrice: null,
				status: 'draft',
				featured: false,
				image
			},
			focus: 'product-card'
		};

		const read = readDraftMessage(draftMessage(draft));

		expect(read?.content?.kind).toBe('product');

		if (read?.content?.kind === 'product') {
			expect(read.content.image).toBe(image);
		}
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
		).toEqual({
			template: 'galeria',
			theme: { ...EMPTY_THEME, fonts: 'serif' },
			content: null,
			focus: null
		});
	});

	it('un contenido o una zona que no se entienden se descartan', () => {
		const read = readDraftMessage({
			type: 'globerce:borrador',
			template: 'editorial',
			theme: EMPTY_THEME,
			content: { kind: 'inventado' },
			focus: 'otra-zona'
		});

		expect(read).toEqual({
			template: 'editorial',
			theme: EMPTY_THEME,
			content: null,
			focus: null
		});
	});

	it('un contenido a medias no se pinta: se ignora entero', () => {
		const read = readDraftMessage({
			type: 'globerce:borrador',
			template: 'editorial',
			theme: EMPTY_THEME,
			content: { kind: 'product', name: 'Sin precio' },
			focus: 'product-card'
		});

		expect(read).toEqual({
			template: 'editorial',
			theme: EMPTY_THEME,
			content: null,
			focus: 'product-card'
		});
	});

	it('reconoce el aviso de que la tienda está lista', () => {
		expect(isReadyMessage({ type: DRAFT_READY })).toBe(true);
		expect(isReadyMessage(null)).toBe(false);
	});
});
