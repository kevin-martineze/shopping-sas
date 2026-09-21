/**
 * Las plantillas con que se puede vestir una tienda.
 *
 * La API solo guarda el código (ver `shared/content/templates.ts` allá); cómo
 * se ve cada una vive acá y en `app.css`, que es quien las pinta. Una tienda
 * con un código que ya no existe no se rompe: `templateOf` la devuelve a la de
 * por defecto.
 *
 * Una plantilla cambia el vestido, nunca el contenido: las mismas productos, los
 * mismos textos de portada y los mismos pedidos se ven igual de bien en las
 * dos. Cambiar de plantilla no borra nada ni obliga a rehacer la tienda.
 */
export const STOREFRONT_TEMPLATES = ['editorial', 'boutique'] as const;

export type StorefrontTemplate = (typeof STOREFRONT_TEMPLATES)[number];

/** Con la que nace toda tienda. Igual que `DEFAULT_TEMPLATE` en la API. */
export const DEFAULT_TEMPLATE: StorefrontTemplate = 'editorial';

export interface TemplateInfo {
	code: StorefrontTemplate;
	name: string;
	/** Una línea: para quién es. */
	tagline: string;
	/** Qué la distingue, en la lengua de quien vende ropa, no en la de quien diseña. */
	features: string[];
}

export const TEMPLATES: TemplateInfo[] = [
	{
		code: 'editorial',
		name: 'Editorial',
		tagline: 'Foto grande, mucho blanco y títulos en serif. Como una revista de moda.',
		features: [
			'Portada con la foto a pantalla completa',
			'Titulares en serif, letras finas',
			'Blancos y grises: manda la producto'
		]
	},
	{
		code: 'boutique',
		name: 'Boutique',
		tagline: 'Tonos cálidos, esquinas suaves y la portada partida en dos. Cercana y clara.',
		features: [
			'Portada con el texto al lado de la foto',
			'Titulares gruesos, fáciles de leer',
			'Arena y terracota, con botones de color'
		]
	}
];

/** La plantilla de un código, o la de por defecto si no se reconoce. */
export function templateOf(code: string | null | undefined): TemplateInfo {
	return TEMPLATES.find((template) => template.code === code) ?? TEMPLATES[0];
}
