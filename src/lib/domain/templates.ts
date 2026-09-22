/**
 * Las plantillas con que se puede vestir una tienda.
 *
 * La API solo guarda el código (ver `shared/content/templates.ts` allá); cómo
 * se ve cada una vive acá y en `app.css`, que es quien las pinta. Una tienda
 * con un código que ya no existe no se rompe: `templateOf` la devuelve a la de
 * por defecto.
 *
 * Una plantilla cambia el vestido, nunca el contenido: los mismos productos,
 * los mismos textos de portada y los mismos pedidos se ven igual de bien en
 * todas. Cambiar de plantilla no borra nada ni obliga a rehacer la tienda.
 *
 * Cada una toma tres decisiones de armado que los componentes leen de aquí
 * —cómo se arma la portada, cómo va la cabecera y cómo se viste la tarjeta—;
 * la paleta, la tipografía y el redondeo van en `app.css` bajo
 * `[data-storefront-template='<código>']`.
 */
export const STOREFRONT_TEMPLATES = [
	'editorial',
	'boutique',
	'galeria',
	'noche',
	'vibrante',
	'atelier'
] as const;

export type StorefrontTemplate = (typeof STOREFRONT_TEMPLATES)[number];

/** Con la que nace toda tienda. Igual que `DEFAULT_TEMPLATE` en la API. */
export const DEFAULT_TEMPLATE: StorefrontTemplate = 'editorial';

/**
 * Cómo se arma la portada de la tienda.
 * - `cover`: la foto a sangre y el texto encima.
 * - `split`: la pantalla en dos, texto y foto lado a lado.
 * - `typographic`: sin foto grande; el titular enorme y debajo los productos.
 * - `centered`: todo centrado y la foto enmarcada, como una invitación.
 * - `block`: un bloque de color con el texto y la foto recortada al lado.
 */
export type HeroLayout = 'cover' | 'split' | 'typographic' | 'centered' | 'block';

/** La cabecera: la barra de siempre, o el nombre centrado en versalitas. */
export type HeaderLayout = 'bar' | 'centered';

/** La tarjeta de producto: sola, con marco fino, o con el precio como sticker. */
export type CardStyle = 'plain' | 'framed' | 'sticker';

export interface TemplateInfo {
	code: StorefrontTemplate;
	name: string;
	/** Una línea: para quién es. */
	tagline: string;
	/** Qué la distingue, en la lengua de quien vende, no en la de quien diseña. */
	features: string[];
	hero: HeroLayout;
	header: HeaderLayout;
	card: CardStyle;
}

export const TEMPLATES: TemplateInfo[] = [
	{
		code: 'editorial',
		name: 'Editorial',
		tagline: 'Foto grande, mucho blanco y títulos en serif. Para que mande la foto.',
		features: [
			'Portada con la foto a pantalla completa',
			'Titulares en serif, letras finas',
			'Blancos y grises: manda el producto'
		],
		hero: 'cover',
		header: 'bar',
		card: 'plain'
	},
	{
		code: 'boutique',
		// El código se queda como está: cambiarlo obligaría a migrar las tiendas
		// que ya lo eligieron, y el nombre visible es lo único que se lee.
		name: 'Cálida',
		tagline: 'Tonos cálidos, esquinas suaves y la portada partida en dos. Cercana y clara.',
		features: [
			'Portada con el texto al lado de la foto',
			'Titulares gruesos, fáciles de leer',
			'Arena y terracota, con botones de color'
		],
		hero: 'split',
		header: 'bar',
		card: 'plain'
	},
	{
		code: 'galeria',
		name: 'Galería',
		tagline: 'Blanco, aire y letras pequeñas. Para objetos que se miran despacio.',
		features: [
			'Portada tipográfica, sin foto grande',
			'Esquinas rectas y líneas finas',
			'Nombres en mayúsculas pequeñas'
		],
		hero: 'typographic',
		header: 'bar',
		card: 'plain'
	},
	{
		code: 'noche',
		name: 'Noche',
		tagline: 'Fondo oscuro, texto marfil y un ámbar para lo que se pulsa.',
		features: [
			'Portada a sangre, con la foto en penumbra',
			'Tarjetas con borde fino',
			'Precios en ámbar'
		],
		hero: 'cover',
		header: 'bar',
		card: 'framed'
	},
	{
		code: 'vibrante',
		name: 'Vibrante',
		tagline: 'Un color fuerte de fondo, letras negras y esquinas muy redondas.',
		features: [
			'Portada en un bloque de color',
			'Botones en píldora, grandes',
			'Precios como stickers'
		],
		hero: 'block',
		header: 'bar',
		card: 'sticker'
	},
	{
		code: 'atelier',
		name: 'Atelier',
		tagline: 'Crema, negro y un dorado apagado. Titulares finos en serif.',
		features: [
			'Portada centrada, con la foto enmarcada',
			'Nombre de la tienda en versalitas',
			'Tarjetas con marco fino y precio en serif'
		],
		hero: 'centered',
		header: 'centered',
		card: 'framed'
	}
];

/** La plantilla de un código, o la de por defecto si no se reconoce. */
export function templateOf(code: string | null | undefined): TemplateInfo {
	return TEMPLATES.find((template) => template.code === code) ?? TEMPLATES[0];
}
