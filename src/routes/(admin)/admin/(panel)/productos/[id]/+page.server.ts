import { error, fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import {
	productAttributesSchema,
	productOptionsSchema,
	productSchema,
	stockUpdateSchema,
	variantMatrixSchema
} from '$lib/schemas/admin';
import {
	generateVariants,
	getProduct,
	listCategories,
	setProductAttributes,
	setProductOptions,
	removeProduct,
	removeProductImage,
	removeVariant,
	reorderProductImages,
	updateProduct,
	updateVariant,
	uploadProductImage
} from '$lib/server/api/panel-catalog';
import { failWith, orFail, panelContext } from '$lib/server/context';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async (event) => {
	const ctx = panelContext(event);
	const product = await getProduct(ctx, event.params.id);

	if (!product.ok && (product.status === 404 || product.status === 400)) {
		error(404, 'Ese producto no existe.');
	}

	// Los ejes ya vienen dentro del producto: son suyos, no de la tienda.
	const categories = await listCategories(ctx);

	return {
		product: orFail(product),
		categories: orFail(categories)
	};
};

export const actions: Actions = {
	actualizar: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const name = String(formData.get('name') ?? '');
		const rawSlug = String(formData.get('slug') ?? '').trim();

		const parsed = productSchema.safeParse({
			name,
			slug: rawSlug === '' ? slugify(name) : rawSlug,
			description: formData.get('description') ?? '',
			categoryId: String(formData.get('categoryId') ?? '') || null,
			basePrice: formData.get('basePrice'),
			compareAtPrice: String(formData.get('compareAtPrice') ?? '') || null,
			status: formData.get('status') ?? 'draft',
			featured: formData.get('featured') === 'on'
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const input = parsed.data;

		const result = await updateProduct(ctx, event.params.id, {
			name: input.name,
			slug: input.slug,
			description: input.description,
			categoryId: input.categoryId ?? null,
			basePrice: input.basePrice,
			compareAtPrice: input.compareAtPrice ?? null,
			status: input.status,
			featured: input.featured
		});

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	/**
	 * Crea las combinaciones variación × color que falten. Nunca borra variantes
	 * existentes: podrían estar dentro de un pedido.
	 */
	/**
	 * Los ejes del producto.
	 *
	 * Llegan como JSON en un campo oculto: son arreglos anidados de largo
	 * variable y `FormData` los aplanaría a `options[0][values][1][hex]`, que
	 * habría que volver a armar aquí. El JSON se valida igual antes de salir.
	 */
	ejes: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		let crudo: unknown;

		try {
			crudo = JSON.parse(String(formData.get('options') ?? '[]'));
		} catch {
			return fail(400, { error: 'No se entendieron los ejes. Vuelve a intentarlo.' });
		}

		const parsed = productOptionsSchema.safeParse({
			productId: event.params.id,
			options: crudo
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los ejes.' });
		}

		const result = await setProductOptions(ctx, event.params.id, parsed.data.options);

		if (!result.ok) return failWith(result);

		return { ok: true, message: 'Ejes guardados.' };
	},

	atributos: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		let crudo: unknown;

		try {
			crudo = JSON.parse(String(formData.get('attributes') ?? '[]'));
		} catch {
			return fail(400, { error: 'No se entendieron los datos. Vuelve a intentarlo.' });
		}

		const parsed = productAttributesSchema.safeParse({
			productId: event.params.id,
			attributes: crudo
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const result = await setProductAttributes(ctx, event.params.id, parsed.data.attributes);

		if (!result.ok) return failWith(result);

		return { ok: true, message: 'Datos guardados.' };
	},

	variantes: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const parsed = variantMatrixSchema.safeParse({
			productId: event.params.id,
			defaultStock: formData.get('defaultStock') ?? 0
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Revisa los datos.' });
		}

		const result = await generateVariants(ctx, event.params.id, {
			defaultStock: parsed.data.defaultStock
		});

		if (!result.ok) return failWith(result);

		return { ok: true, created: result.data.created };
	},

	stock: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const parsed = stockUpdateSchema.safeParse({
			variantId: formData.get('variantId'),
			stock: formData.get('stock')
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Cantidad inválida.' });
		}

		const priceRaw = String(formData.get('priceOverride') ?? '').trim();
		const priceOverride = priceRaw === '' ? null : Number(priceRaw);

		if (priceOverride !== null && (!Number.isInteger(priceOverride) || priceOverride < 0)) {
			return fail(400, { error: 'Precio de variante inválido.' });
		}

		const result = await updateVariant(ctx, parsed.data.variantId, {
			stock: parsed.data.stock,
			priceOverride,
			// Un checkbox desmarcado no viaja en el form: ausencia significa inactiva.
			active: formData.get('active') === 'on'
		});

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	borrarVariante: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		// Si la variante está en un pedido, la API la desactiva en vez de borrarla.
		const result = await removeVariant(ctx, String(formData.get('variantId') ?? ''));

		if (!result.ok) return failWith(result);

		return { ok: true, deactivated: result.data.result === 'deactivated' };
	},

	subirImagen: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const file = formData.get('file');
		const colorId = String(formData.get('colorId') ?? '') || null;

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Elige una imagen.' });
		}

		// La API convierte la foto, la guarda y la registra: acá solo se reenvía.
		const result = await uploadProductImage(ctx, event.params.id, file, colorId);

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	borrarImagen: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();

		const result = await removeProductImage(ctx, String(formData.get('imageId') ?? ''));

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	imagenPrincipal: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const imageId = String(formData.get('imageId') ?? '');

		const product = await getProduct(ctx, event.params.id);

		if (!product.ok) return failWith(product);

		const ordered = [
			imageId,
			...product.data.product_images
				.filter((image) => image.id !== imageId)
				.sort((a, b) => a.sort_order - b.sort_order)
				.map((image) => image.id)
		];

		const result = await reorderProductImages(ctx, event.params.id, ordered);

		if (!result.ok) return failWith(result);

		return { ok: true };
	},

	eliminar: async (event) => {
		const ctx = panelContext(event);
		const result = await removeProduct(ctx, event.params.id);

		if (!result.ok) return failWith(result);

		if (result.data.result === 'archived') {
			return fail(409, {
				error: 'Este producto está en pedidos, así que la archivamos en vez de borrarla.'
			});
		}

		redirect(303, '/admin/productos');
	}
};
