import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { categorySchema, colorSchema, sizeSchema } from '$lib/schemas/admin';
import {
	CatalogError,
	getCatalogUsage,
	listAdminCategories,
	listColors,
	listSizes,
	removalMessage,
	removeOrHide
} from '$lib/server/catalogs';
import { supabaseAdmin } from '$lib/server/supabase';
import { slugify } from '$lib/utils/slug';

export const load: PageServerLoad = async () => {
	const [colors, sizes, categories, usage] = await Promise.all([
		listColors(true),
		listSizes(true),
		listAdminCategories(),
		getCatalogUsage()
	]);

	return { colors, sizes, categories, usage };
};

/** El nombre manda: el slug se deriva y se numera si ya existe. */
async function uniqueSlug(table: 'colors' | 'categories', name: string, ignoreId?: string) {
	const base = slugify(name) || 'sin-nombre';
	const { data } = await supabaseAdmin()
		.from(table)
		.select('id, slug')
		.like('slug', `${base}%`)
		.returns<{ id: string; slug: string }[]>();

	const taken = new Set((data ?? []).filter((row) => row.id !== ignoreId).map((row) => row.slug));

	if (!taken.has(base)) return base;

	for (let suffix = 2; suffix < 100; suffix += 1) {
		if (!taken.has(`${base}-${suffix}`)) return `${base}-${suffix}`;
	}

	return `${base}-${Date.now()}`;
}

function parseColor(formData: FormData) {
	return colorSchema.safeParse({
		name: formData.get('name'),
		hex: formData.get('hex'),
		sortOrder: formData.get('sortOrder') || 0,
		active: formData.get('active') === 'on'
	});
}

function parseSize(formData: FormData) {
	return sizeSchema.safeParse({
		label: formData.get('label'),
		sortOrder: formData.get('sortOrder') || 0,
		active: formData.get('active') === 'on'
	});
}

function parseCategory(formData: FormData) {
	return categorySchema.safeParse({
		name: formData.get('name'),
		sortOrder: formData.get('sortOrder') || 0,
		active: formData.get('active') === 'on'
	});
}

const firstIssue = (issues: { message: string }[]) => issues.at(0)?.message ?? 'Revisa los datos.';

export const actions: Actions = {
	crearColor: async ({ request }) => {
		const parsed = parseColor(await request.formData());
		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const { error } = await supabaseAdmin()
			.from('colors')
			.insert({
				name: parsed.data.name,
				slug: await uniqueSlug('colors', parsed.data.name),
				hex: parsed.data.hex.toUpperCase(),
				sort_order: parsed.data.sortOrder,
				active: parsed.data.active
			});

		if (error) return fail(500, { error: 'No pudimos crear el color.' });

		return { message: `Color ${parsed.data.name} creado.` };
	},

	actualizarColor: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const parsed = parseColor(formData);

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const { error } = await supabaseAdmin()
			.from('colors')
			.update({
				name: parsed.data.name,
				hex: parsed.data.hex.toUpperCase(),
				sort_order: parsed.data.sortOrder,
				active: parsed.data.active
			})
			.eq('id', id);

		if (error) return fail(500, { error: 'No pudimos guardar el color.' });

		return { message: 'Color guardado.' };
	},

	borrarColor: async ({ request }) => {
		const formData = await request.formData();

		try {
			const result = await removeOrHide('colors', String(formData.get('id') ?? ''));
			return { message: removalMessage(result, 'El color') };
		} catch (cause) {
			const message = cause instanceof CatalogError ? cause.message : 'No pudimos borrar el color.';
			return fail(500, { error: message });
		}
	},

	crearTalla: async ({ request }) => {
		const parsed = parseSize(await request.formData());
		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const { error } = await supabaseAdmin().from('sizes').insert({
			label: parsed.data.label,
			sort_order: parsed.data.sortOrder,
			active: parsed.data.active
		});

		if (error) {
			return fail(400, {
				error: error.code === '23505' ? 'Ya existe esa talla.' : 'No pudimos crear la talla.'
			});
		}

		return { message: `Talla ${parsed.data.label} creada.` };
	},

	actualizarTalla: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const parsed = parseSize(formData);

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const { error } = await supabaseAdmin()
			.from('sizes')
			.update({
				label: parsed.data.label,
				sort_order: parsed.data.sortOrder,
				active: parsed.data.active
			})
			.eq('id', id);

		if (error) {
			return fail(400, {
				error: error.code === '23505' ? 'Ya existe esa talla.' : 'No pudimos guardar la talla.'
			});
		}

		return { message: 'Talla guardada.' };
	},

	borrarTalla: async ({ request }) => {
		const formData = await request.formData();

		try {
			const result = await removeOrHide('sizes', String(formData.get('id') ?? ''));
			return { message: removalMessage(result, 'La talla') };
		} catch (cause) {
			const message = cause instanceof CatalogError ? cause.message : 'No pudimos borrar la talla.';
			return fail(500, { error: message });
		}
	},

	crearCategoria: async ({ request }) => {
		const parsed = parseCategory(await request.formData());
		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const { error } = await supabaseAdmin()
			.from('categories')
			.insert({
				name: parsed.data.name,
				slug: await uniqueSlug('categories', parsed.data.name),
				sort_order: parsed.data.sortOrder,
				active: parsed.data.active
			});

		if (error) return fail(500, { error: 'No pudimos crear la categoría.' });

		return { message: `Categoría ${parsed.data.name} creada.` };
	},

	actualizarCategoria: async ({ request }) => {
		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const parsed = parseCategory(formData);

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const { error } = await supabaseAdmin()
			.from('categories')
			.update({
				name: parsed.data.name,
				sort_order: parsed.data.sortOrder,
				active: parsed.data.active
			})
			.eq('id', id);

		if (error) return fail(500, { error: 'No pudimos guardar la categoría.' });

		return { message: 'Categoría guardada.' };
	},

	borrarCategoria: async ({ request }) => {
		const formData = await request.formData();

		try {
			// Las prendas apuntan a la categoría con `on delete set null`, así que
			// borrarla las deja sin categoría en vez de fallar.
			const result = await removeOrHide('categories', String(formData.get('id') ?? ''));
			return { message: removalMessage(result, 'La categoría') };
		} catch (cause) {
			const message =
				cause instanceof CatalogError ? cause.message : 'No pudimos borrar la categoría.';
			return fail(500, { error: message });
		}
	}
};
