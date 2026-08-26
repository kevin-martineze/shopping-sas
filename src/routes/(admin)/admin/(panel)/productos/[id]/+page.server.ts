import { error, fail, redirect } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { productSchema, stockUpdateSchema, variantMatrixSchema } from '$lib/schemas/admin';
import { getAdminProduct } from '$lib/server/admin';
import { ImageUploadError, deleteProductImage, uploadProductImage } from '$lib/server/images';
import { listCategories } from '$lib/server/store';
import { supabaseAdmin } from '$lib/server/supabase';
import { buildSku, slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async ({ params, locals }) => {
	const product = await getAdminProduct(params.id);

	if (!product) error(404, 'Esa prenda no existe.');

	const [categories, colors, sizes] = await Promise.all([
		listCategories(locals.supabase),
		supabaseAdmin()
			.from('colors')
			.select('*')
			.order('sort_order')
			.returns<{ id: string; slug: string; name: string; hex: string; sort_order: number }[]>(),
		supabaseAdmin()
			.from('sizes')
			.select('*')
			.order('sort_order')
			.returns<{ id: string; label: string; sort_order: number }[]>()
	]);

	return {
		product,
		categories,
		colors: colors.data ?? [],
		sizes: sizes.data ?? []
	};
};

export const actions: Actions = {
	actualizar: async ({ request, params }) => {
		const formData = await request.formData();
		const name = String(formData.get('name') ?? '');
		const rawSlug = String(formData.get('slug') ?? '').trim();

		const parsed = productSchema.safeParse({
			name,
			slug: rawSlug === '' ? slugify(name) : rawSlug,
			description: formData.get('description') ?? '',
			material: formData.get('material') ?? '',
			care: formData.get('care') ?? '',
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

		const { error: updateError } = await supabaseAdmin()
			.from('products')
			.update({
				name: input.name,
				slug: input.slug,
				description: input.description || null,
				material: input.material || null,
				care: input.care || null,
				category_id: input.categoryId ?? null,
				base_price: input.basePrice,
				compare_at_price: input.compareAtPrice || null,
				status: input.status,
				featured: input.featured
			})
			.eq('id', params.id);

		if (updateError) {
			return fail(400, {
				error:
					updateError.code === '23505'
						? 'Ya existe otra prenda con ese slug.'
						: 'No pudimos guardar los cambios.'
			});
		}

		return { ok: true };
	},

	/**
	 * Crea las combinaciones talla × color que falten. Nunca borra variantes
	 * existentes: podrían estar dentro de un pedido.
	 */
	variantes: async ({ request, params }) => {
		const formData = await request.formData();

		const parsed = variantMatrixSchema.safeParse({
			productId: params.id,
			colorIds: formData.getAll('colorIds').map(String),
			sizeIds: formData.getAll('sizeIds').map(String),
			defaultStock: formData.get('defaultStock') ?? 0
		});

		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues.at(0)?.message ?? 'Elige colores y tallas.' });
		}

		const client = supabaseAdmin();
		const product = await getAdminProduct(params.id);

		if (!product) return fail(404, { error: 'Prenda no encontrada.' });

		const [colors, sizes] = await Promise.all([
			client
				.from('colors')
				.select('id, slug')
				.in('id', parsed.data.colorIds)
				.returns<{ id: string; slug: string }[]>(),
			client
				.from('sizes')
				.select('id, label')
				.in('id', parsed.data.sizeIds)
				.returns<{ id: string; label: string }[]>()
		]);

		const existing = new Set(
			product.variants.map((variant) => `${variant.color_id}:${variant.size_id}`)
		);

		const rows = [];

		for (const color of colors.data ?? []) {
			for (const size of sizes.data ?? []) {
				if (existing.has(`${color.id}:${size.id}`)) continue;

				rows.push({
					product_id: params.id,
					color_id: color.id,
					size_id: size.id,
					sku: buildSku(product.slug, color.slug, size.label),
					stock: parsed.data.defaultStock
				});
			}
		}

		if (rows.length === 0) return { ok: true, created: 0 };

		const { error: insertError } = await client.from('variants').insert(rows);

		if (insertError) return fail(500, { error: 'No pudimos crear las variantes.' });

		return { ok: true, created: rows.length };
	},

	stock: async ({ request }) => {
		const formData = await request.formData();

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

		const { error: updateError } = await supabaseAdmin()
			.from('variants')
			.update({
				stock: parsed.data.stock,
				price_override: priceOverride,
				// Un checkbox desmarcado no viaja en el form: ausencia significa inactiva.
				active: formData.get('active') === 'on'
			})
			.eq('id', parsed.data.variantId);

		if (updateError) return fail(500, { error: 'No pudimos guardar el inventario.' });

		return { ok: true };
	},

	borrarVariante: async ({ request }) => {
		const formData = await request.formData();
		const variantId = String(formData.get('variantId') ?? '');

		const { error: deleteError } = await supabaseAdmin()
			.from('variants')
			.delete()
			.eq('id', variantId);

		if (deleteError) {
			// Si la variante está en un pedido, se desactiva en vez de borrarse.
			await supabaseAdmin()
				.from('variants')
				.update({ active: false, stock: 0 })
				.eq('id', variantId);
			return { ok: true, deactivated: true };
		}

		return { ok: true };
	},

	subirImagen: async ({ request, params }) => {
		const formData = await request.formData();
		const file = formData.get('file');
		const colorId = String(formData.get('colorId') ?? '') || null;

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Elige una imagen.' });
		}

		const product = await getAdminProduct(params.id);
		if (!product) return fail(404, { error: 'Prenda no encontrada.' });

		try {
			const uploaded = await uploadProductImage(file, product.slug);
			const nextOrder = product.product_images.length;

			const { error: insertError } = await supabaseAdmin().from('product_images').insert({
				product_id: params.id,
				color_id: colorId,
				storage_path: uploaded.storagePath,
				url_full: uploaded.urlFull,
				url_card: uploaded.urlCard,
				url_thumb: uploaded.urlThumb,
				lqip: uploaded.lqip,
				alt: product.name,
				sort_order: nextOrder
			});

			if (insertError) return fail(500, { error: 'La imagen se subió pero no se pudo guardar.' });
		} catch (cause) {
			const message =
				cause instanceof ImageUploadError ? cause.message : 'No pudimos procesar la imagen.';
			return fail(400, { error: message });
		}

		return { ok: true };
	},

	borrarImagen: async ({ request }) => {
		const formData = await request.formData();
		const imageId = String(formData.get('imageId') ?? '');

		const { data: image } = await supabaseAdmin()
			.from('product_images')
			.select('storage_path')
			.eq('id', imageId)
			.maybeSingle<{ storage_path: string }>();

		if (image) {
			// Si falla el borrado en Storage no bloqueamos: queda un archivo huérfano.
			await deleteProductImage(image.storage_path).catch(() => undefined);
		}

		await supabaseAdmin().from('product_images').delete().eq('id', imageId);

		return { ok: true };
	},

	imagenPrincipal: async ({ request, params }) => {
		const formData = await request.formData();
		const imageId = String(formData.get('imageId') ?? '');

		const product = await getAdminProduct(params.id);
		if (!product) return fail(404, { error: 'Prenda no encontrada.' });

		const ordered = [
			imageId,
			...product.product_images
				.filter((image) => image.id !== imageId)
				.sort((a, b) => a.sort_order - b.sort_order)
				.map((image) => image.id)
		];

		await Promise.all(
			ordered.map((id, index) =>
				supabaseAdmin().from('product_images').update({ sort_order: index }).eq('id', id)
			)
		);

		return { ok: true };
	},

	eliminar: async ({ params }) => {
		const product = await getAdminProduct(params.id);

		if (product) {
			await Promise.all(
				product.product_images.map((image) =>
					deleteProductImage(image.storage_path).catch(() => undefined)
				)
			);
		}

		const { error: deleteError } = await supabaseAdmin()
			.from('products')
			.delete()
			.eq('id', params.id);

		if (deleteError) {
			// Prenda con pedidos asociados: se archiva para conservar el historial.
			await supabaseAdmin().from('products').update({ status: 'archived' }).eq('id', params.id);
			return fail(409, {
				error: 'Esta prenda está en pedidos, así que la archivamos en vez de borrarla.'
			});
		}

		redirect(303, '/admin/productos');
	}
};
