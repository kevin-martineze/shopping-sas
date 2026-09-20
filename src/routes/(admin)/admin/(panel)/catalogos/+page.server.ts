import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { categorySchema, colorSchema, sizeSchema } from '$lib/schemas/admin';
import {
	createCategory,
	createColor,
	createSize,
	listCategories,
	listColors,
	listSizes,
	removalMessage,
	removeCategory,
	removeColor,
	removeSize,
	updateCategory,
	updateColor,
	updateSize
} from '$lib/server/api/panel-catalog';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ctx = panelContext(event);

	const [colorsResult, sizesResult, categoriesResult] = await Promise.all([
		listColors(ctx, true),
		listSizes(ctx, true),
		listCategories(ctx, true)
	]);

	const colors = orFail(colorsResult);
	const sizes = orFail(sizesResult);
	const categories = orFail(categoriesResult);

	// Cuántas prendas o variantes dependen de cada fila, para avisar antes de borrar.
	const usage = {
		colors: Object.fromEntries(colors.map((color) => [color.id, color.usage])),
		sizes: Object.fromEntries(sizes.map((size) => [size.id, size.usage])),
		categories: Object.fromEntries(categories.map((category) => [category.id, category.usage]))
	};

	return { colors, sizes, categories, usage };
};

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

const formId = (formData: FormData) => String(formData.get('id') ?? '');

export const actions: Actions = {
	crearColor: async (event) => {
		const ctx = panelContext(event);
		const parsed = parseColor(await event.request.formData());

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const result = await createColor(ctx, parsed.data);

		if (!result.ok) return failWith(result);

		return { message: `Color ${parsed.data.name} creado.` };
	},

	actualizarColor: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const parsed = parseColor(formData);

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const result = await updateColor(ctx, formId(formData), parsed.data);

		if (!result.ok) return failWith(result);

		return { message: 'Color guardado.' };
	},

	borrarColor: async (event) => {
		const ctx = panelContext(event);
		const result = await removeColor(ctx, formId(await event.request.formData()));

		if (!result.ok) return failWith(result);

		return { message: removalMessage(result.data.hidden, 'El color') };
	},

	crearTalla: async (event) => {
		const ctx = panelContext(event);
		const parsed = parseSize(await event.request.formData());

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const result = await createSize(ctx, parsed.data);

		if (!result.ok) return failWith(result);

		return { message: `Talla ${parsed.data.label} creada.` };
	},

	actualizarTalla: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const parsed = parseSize(formData);

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const result = await updateSize(ctx, formId(formData), parsed.data);

		if (!result.ok) return failWith(result);

		return { message: 'Talla guardada.' };
	},

	borrarTalla: async (event) => {
		const ctx = panelContext(event);
		const result = await removeSize(ctx, formId(await event.request.formData()));

		if (!result.ok) return failWith(result);

		return { message: removalMessage(result.data.hidden, 'La talla') };
	},

	crearCategoria: async (event) => {
		const ctx = panelContext(event);
		const parsed = parseCategory(await event.request.formData());

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const result = await createCategory(ctx, parsed.data);

		if (!result.ok) return failWith(result);

		return { message: `Categoría ${parsed.data.name} creada.` };
	},

	actualizarCategoria: async (event) => {
		const ctx = panelContext(event);
		const formData = await event.request.formData();
		const parsed = parseCategory(formData);

		if (!parsed.success) return fail(400, { error: firstIssue(parsed.error.issues) });

		const result = await updateCategory(ctx, formId(formData), parsed.data);

		if (!result.ok) return failWith(result);

		return { message: 'Categoría guardada.' };
	},

	borrarCategoria: async (event) => {
		const ctx = panelContext(event);

		// Las prendas apuntan a la categoría con `onDelete: SetNull`, así que
		// borrarla las deja sin categoría en vez de fallar.
		const result = await removeCategory(ctx, formId(await event.request.formData()));

		if (!result.ok) return failWith(result);

		return { message: removalMessage(result.data.hidden, 'La categoría') };
	}
};
