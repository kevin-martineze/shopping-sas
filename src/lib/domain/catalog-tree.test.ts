import { describe, expect, it } from 'vitest';

import { buildCategoryTree, type Category } from '$lib/domain/catalog';

function category(id: string, parent: string | null, sortOrder: number, name = id): Category {
	return { id, slug: id, name, parent_id: parent, sort_order: sortOrder, active: true };
}

const names = (nodes: { category: Category }[]) => nodes.map((node) => node.category.id);

describe('buildCategoryTree', () => {
	it('anida las hijas bajo su padre', () => {
		const tree = buildCategoryTree([
			category('ropa', null, 1),
			category('camisas', 'ropa', 1),
			category('pantalones', 'ropa', 2),
			category('bolsos', null, 2)
		]);

		expect(names(tree)).toEqual(['ropa', 'bolsos']);
		expect(names(tree[0]?.children ?? [])).toEqual(['camisas', 'pantalones']);
		expect(tree[1]?.children).toEqual([]);
	});

	it('ordena por sort_order y, a igualdad, por nombre', () => {
		const tree = buildCategoryTree([
			category('z', null, 1, 'Zapatos'),
			category('a', null, 1, 'Abrigos'),
			category('m', null, 0, 'Medias')
		]);

		expect(names(tree)).toEqual(['m', 'a', 'z']);
	});

	it('una categoría con padre que no existe sube a la raíz', () => {
		const tree = buildCategoryTree([category('huerfana', 'no-esta', 1), category('ropa', null, 2)]);

		expect(names(tree)).toEqual(['huerfana', 'ropa']);
	});

	it('un ciclo no pierde categorías ni se repite', () => {
		const tree = buildCategoryTree([
			category('a', 'b', 1),
			category('b', 'a', 2),
			category('ropa', null, 3)
		]);

		const flat = tree.flatMap(function walk(node): string[] {
			return [node.category.id, ...node.children.flatMap(walk)];
		});

		expect(flat.sort()).toEqual(['a', 'b', 'ropa']);
	});

	it('una categoría que es padre de sí misma queda como raíz', () => {
		const tree = buildCategoryTree([category('sola', 'sola', 1)]);

		expect(names(tree)).toEqual(['sola']);
		expect(tree[0]?.children).toEqual([]);
	});

	it('sin categorías, el árbol está vacío', () => {
		expect(buildCategoryTree([])).toEqual([]);
	});
});
