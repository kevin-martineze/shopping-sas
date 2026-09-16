import { fail } from '@sveltejs/kit';

import type { UploadedImage } from '$lib/server/images';
import type { Actions, PageServerLoad } from './$types';
import { collectionSchema } from '$lib/schemas/admin';
import { listProducts } from '$lib/server/api/panel-catalog';
import {
	createCollection,
	listCollections,
	removeCollection,
	removeCollectionProduct,
	setCollectionProduct,
	updateCollectionPhoto
} from '$lib/server/api/panel-content';
import { failWith, orFail, panelContext } from '$lib/server/context';
import { ImageUploadError, uploadImage } from '$lib/server/images';
import { deleteStoredImages } from '$lib/server/storage';
import { slugify } from '$lib/utils/slug';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function uploadError(cause: unknown) {
	return fail(400, {
		error: cause instanceof ImageUploadError ? cause.message : 'No pudimos procesar la foto.'
	});
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

		const file = formData.get('file');
		let hero: UploadedImage | null = null;

		if (file instanceof File && file.size > 0) {
			try {
				hero = await uploadImage(file, `colecciones/${parsed.data.slug}`);
			} catch (cause) {
				return uploadError(cause);
			}
		}

		const result = await createCollection(ctx, {
			name: parsed.data.name,
			slug: parsed.data.slug,
			description: parsed.data.description || null,
			active: parsed.data.active,
			sortOrder: parsed.data.sortOrder,
			heroImageUrl: hero?.urlFull ?? null,
			heroStoragePath: hero?.storagePath ?? null
		});

		if (!result.ok) {
			// La foto ya subió pero la colección no se creó: se borra para no dejarla huérfana.
			if (hero) await deleteStoredImages([hero.storagePath]);

			return failWith(result);
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

		// Se valida antes de subir: un id malo dejaría la foto huérfana.
		if (!UUID.test(id)) return fail(404, { error: 'Colección no encontrada.' });

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Elige una foto.' });
		}

		let uploaded: UploadedImage;

		try {
			uploaded = await uploadImage(file, `colecciones/${id}`);
		} catch (cause) {
			return uploadError(cause);
		}

		const result = await updateCollectionPhoto(ctx, id, {
			heroImageUrl: uploaded.urlFull,
			heroStoragePath: uploaded.storagePath
		});

		if (!result.ok) {
			await deleteStoredImages([uploaded.storagePath]);

			return failWith(result);
		}

		// La anterior se borra al final: si algo falla antes, no se pierde nada.
		if (result.data.replacedHeroStoragePath) {
			await deleteStoredImages([result.data.replacedHeroStoragePath]);
		}

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

		await deleteStoredImages(result.data.storagePaths);

		return { ok: true };
	}
};
