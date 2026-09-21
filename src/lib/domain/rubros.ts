/**
 * Ejes sugeridos según lo que se venda.
 *
 * No son una taxonomía ni un dato que se guarde: son atajos. El modelo no
 * conoce rubros —cada producto declara los ejes que quiera— pero alguien que
 * abre su primera tienda no tiene por qué inventarse desde cero que la ropa se
 * divide en talla y color.
 *
 * La lista es corta a propósito. Veinte rubros obligarían a buscar el propio
 * entre diecinueve que no sirven, que es justo el problema que tenía el modelo
 * anterior con sus dos ejes fijos.
 */
export interface Rubro {
	id: string;
	/** Cómo se llama en el botón. */
	label: string;
	/** Qué se vende así, para que se reconozca sin pensar. */
	hint: string;
	options: { name: string; values: { value: string; hex?: string }[] }[];
}

/** Los tonos de las tallas y colores más comunes, para no arrancar en gris. */
const NEGRO = '#141414';
const BLANCO = '#FFFFFF';
const BEIGE = '#D8C3A5';

export const RUBROS: readonly Rubro[] = [
	{
		id: 'ropa',
		label: 'Ropa',
		hint: 'Camisas, vestidos, pantalones',
		options: [
			{
				name: 'Color',
				values: [
					{ value: 'Negro', hex: NEGRO },
					{ value: 'Blanco', hex: BLANCO },
					{ value: 'Beige', hex: BEIGE }
				]
			},
			{
				name: 'Talla',
				values: [{ value: 'S' }, { value: 'M' }, { value: 'L' }]
			}
		]
	},
	{
		id: 'calzado',
		label: 'Calzado',
		hint: 'Zapatos, tenis, sandalias',
		options: [
			{
				name: 'Color',
				values: [
					{ value: 'Negro', hex: NEGRO },
					{ value: 'Blanco', hex: BLANCO }
				]
			},
			{
				name: 'Talla',
				values: [{ value: '36' }, { value: '37' }, { value: '38' }, { value: '39' }]
			}
		]
	},
	{
		id: 'cafe',
		label: 'Café',
		hint: 'Grano, molido, por peso',
		options: [
			{
				name: 'Molienda',
				values: [{ value: 'Grano entero' }, { value: 'Fina' }, { value: 'Gruesa' }]
			},
			{ name: 'Peso', values: [{ value: '250 g' }, { value: '500 g' }, { value: '1 kg' }] }
		]
	},
	{
		id: 'cosmetica',
		label: 'Cosmética',
		hint: 'Cremas, aceites, maquillaje',
		options: [{ name: 'Presentación', values: [{ value: '30 ml' }, { value: '100 ml' }] }]
	},
	{
		id: 'sin-variaciones',
		label: 'Sin variaciones',
		hint: 'Libros, cuadros, piezas únicas',
		options: []
	}
];
