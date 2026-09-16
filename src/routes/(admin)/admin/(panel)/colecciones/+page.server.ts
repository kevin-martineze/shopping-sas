import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { collectionSchema } from '$lib/schemas/admin';
import { listProducts } from '$lib/server/api/panel-catalog';
import {
	createCollection,
	listCollections,
	removeCollection,
	removeCollectionProduct,
	setCollectionProduct,
	uploadCollectionHero
} from '$lib/server/api/panel-content';
import { failWith, orFail, panelContext } from '$lib/server/context';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async (event) => {
	const ctx = panelContext(event);

	const [collectionsResult, productsResult] = await Promise.all([
		listCollections(ctx),
		listProducts(ctx, null)
	]);

	const { collections, links } = orFail(collectionsResult);

	return {
		collections,
		products: orFail(productsResult).map((product) => ({ id: product.id, name: product.name })),
		links
	};
};

/** Posición sobre la foto: vacío o fuera de 0-100 la deja fuera de la imagen. */
function readHotspot(value: FormDataEntryValue | null): number | null {
	const raw = String(value ?? '').trim();
	const number = Number(raw);

	if (raw === '' || !Number.isFinite(number) || number < 0 || number > 100) return null;

	return Math.round(number * 100) / 100;
}

export const actions: Actions = {
	crear: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const name = String(formData.get('name') ?? '');
		const rawSlug = String(formData.get('slug') ?? '').trim();

		const parsed = collectionSchema.safeParse({
			name,
			slug: rawSlug === '' ? slugify(name) : rawSlug,
			description: formData.get('description') ?? '',
			active: formData.get('active') === 'on',
			sortOrder: formData.get('sortOrder') || 0
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const result = await createCollection(ctx, {
			name: parsed.data.name,
			slug: parsed.data.slug,
			description: parsed.data.description || null,
			active: parsed.data.active,
			sortOrder: parsed.data.sortOrder
		});

		if (!result.ok) return failWith(result);

		// La foto va aparte: la colección ya existe aunque la foto falle.
		const file = formData.get('file');

		if (file instanceof File && file.size > 0) {
			const hero = await uploadCollectionHero(ctx, result.data.id, file);

			if (!hero.ok) {
				return fail(hero.status >= 400 && hero.status < 500 ? hero.status : 503, {
					error: `La colección se creó, pero la foto no: ${hero.message}`
				});
			}
		}

		return { ok: true };
	},

	/** Etiqueta una prenda sobre la foto editorial, o mueve su punto si ya estaba. */
	agregarProducto: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const collectionId = String(formData.get('collectionId') ?? '');
		const productId = String(formData.get('productId') ?? '');

		if (!collectionId || !productId) {
			return fail(400, { error: 'Elige colección y prenda.' });
		}

		const result = await setCollectionProduct(ctx, collectionId, productId, {
			hotspotX: readHotspot(formData.get('hotspotX')),
			hotspotY: readHotspot(formData.get('hotspotY'))
		});

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	cambiarFoto: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const id = String(formData.get('id') ?? '');
		const file = formData.get('file');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Elige una foto.' });
		}

		// La API convierte la foto, guarda la nueva y borra la anterior.
		const result = await uploadCollectionHero(ctx, id, file);

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	quitarProducto: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const result = await removeCollectionProduct(
			ctx,
			String(formData.get('collectionId') ?? ''),
			String(formData.get('productId') ?? '')
		);

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	eliminar: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const result = await removeCollection(ctx, String(formData.get('id') ?? ''));

		if (!result.ok) return failWith(result);

		return { ok: true };
	}
};
