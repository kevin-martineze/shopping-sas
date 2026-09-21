import { fail } from '@sveltejs/kit';

import type { Actions, PageServerLoad } from './$types';
import { categorySchema } from '$lib/schemas/admin';
import {
	createCategory,
	listCategories,
	removalMessage,
	removeCategory,
	updateCategory
} from '$lib/server/api/panel-catalog';
import { failWith, orFail, panelContext } from '$lib/server/context';

export const load: PageServerLoad = async (event) => {
	const ctx = panelContext(event);

	// Colores y variaciones ya no viven aquí: son ejes de cada producto y se editan
	// en su ficha. Una lista por tienda obligaba a todas a vender por color y
	// variación, que es lo que impedía vender un libro.
	const categories = orFail(await listCategories(ctx, true));

	// Cuántos productos dependen de cada fila, para avisar antes de borrar.
	const usage = {
		categories: Object.fromEntries(categories.map((category) => [category.id, category.usage]))
	};

	return { categories, usage };
};

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

		// Los productos apuntan a la categoría con `onDelete: SetNull`, así que
		// borrarla las deja sin categoría en vez de fallar.
		const result = await removeCategory(ctx, formId(await event.request.formData()));

		if (!result.ok) return failWith(result);

		return { message: removalMessage(result.data.hidden, 'La categoría') };
	}
};
