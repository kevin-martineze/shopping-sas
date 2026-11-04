import type { ProductStatus } from '$lib/domain/catalog';

/**
 * Los campos editables de la ficha de un producto, tal como viven en el
 * formulario del panel.
 *
 * `basePrice` y `compareAtPrice` aceptan `''` porque mientras la dueña escribe
 * el campo puede quedar vacío; el borrador de la tienda los convierte a número
 * o `null` antes de mandarlos. El resto es lo que la ficha necesita para
 * pintarse igual que la tienda.
 */
export interface ProductFormValues {
	name: string;
	slug: string;
	description: string;
	categoryId: string;
	basePrice: number | '';
	compareAtPrice: number | '';
	status: ProductStatus;
	featured: boolean;
}
