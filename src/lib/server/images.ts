import { Buffer } from 'node:buffer';

import sharp from 'sharp';

import { supabaseAdmin } from '$lib/server/supabase';

const BUCKET = 'product-images';

/**
 * Tamaños que sirve la tienda. Se generan al subir porque la transformación
 * de imágenes de Supabase Storage solo existe en los planes de pago.
 */
const SIZES = [
	{ key: 'thumb', width: 400 },
	{ key: 'card', width: 800 },
	{ key: 'full', width: 1600 }
] as const;

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export interface UploadedImage {
	storagePath: string;
	urlThumb: string;
	urlCard: string;
	urlFull: string;
	lqip: string;
}

export class ImageUploadError extends Error {}

function publicUrl(path: string): string {
	return supabaseAdmin().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Convierte la foto original a WebP en tres anchos y genera un LQIP embebido
 * (base64 diminuto) que se pinta borroso mientras carga la imagen real.
 */
export async function uploadProductImage(file: File, productSlug: string): Promise<UploadedImage> {
	return uploadImage(file, productSlug);
}

/**
 * Sube una imagen a la carpeta indicada del bucket, en tres anchos más el LQIP.
 * La usan tanto las fotos de prenda como la portada de una colección.
 */
export async function uploadImage(file: File, folder: string): Promise<UploadedImage> {
	if (!file.type.startsWith('image/')) {
		throw new ImageUploadError('El archivo no es una imagen.');
	}

	if (file.size > MAX_UPLOAD_BYTES) {
		throw new ImageUploadError('La imagen pesa más de 12 MB.');
	}

	const original = Buffer.from(await file.arrayBuffer());
	const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
	const basePath = `${folder}/${stamp}`;
	const storage = supabaseAdmin().storage.from(BUCKET);

	const urls: Record<string, string> = {};

	for (const size of SIZES) {
		const buffer = await sharp(original)
			.rotate()
			.resize({ width: size.width, withoutEnlargement: true })
			.webp({ quality: size.key === 'thumb' ? 70 : 80 })
			.toBuffer();

		const path = `${basePath}-${size.key}.webp`;
		const { error } = await storage.upload(path, buffer, {
			contentType: 'image/webp',
			cacheControl: '31536000',
			upsert: false
		});

		if (error) throw new ImageUploadError(`No se pudo subir la imagen: ${error.message}`);

		urls[size.key] = publicUrl(path);
	}

	const lqipBuffer = await sharp(original)
		.resize({ width: 24 })
		.blur(1)
		.webp({ quality: 30 })
		.toBuffer();

	return {
		storagePath: basePath,
		urlThumb: urls.thumb,
		urlCard: urls.card,
		urlFull: urls.full,
		lqip: `data:image/webp;base64,${lqipBuffer.toString('base64')}`
	};
}

/** Borra los tres tamaños de una imagen a partir de su ruta base. */
export async function deleteProductImage(storagePath: string): Promise<void> {
	const paths = SIZES.map((size) => `${storagePath}-${size.key}.webp`);
	const { error } = await supabaseAdmin().storage.from(BUCKET).remove(paths);

	if (error) throw new ImageUploadError(`No se pudo borrar la imagen: ${error.message}`);
}
