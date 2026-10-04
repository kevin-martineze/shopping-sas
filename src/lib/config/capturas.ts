import catalogoCelular300 from '$lib/assets/marketing/tienda-catalogo-celular-300.webp';
import catalogoCelular600 from '$lib/assets/marketing/tienda-catalogo-celular-600.webp';
import destacados1920 from '$lib/assets/marketing/tienda-destacados-1920.webp';
import destacados960 from '$lib/assets/marketing/tienda-destacados-960.webp';
import portada1920 from '$lib/assets/marketing/tienda-portada-1920.webp';
import portada960 from '$lib/assets/marketing/tienda-portada-960.webp';
import productoCelular300 from '$lib/assets/marketing/tienda-producto-celular-300.webp';
import productoCelular600 from '$lib/assets/marketing/tienda-producto-celular-600.webp';

/**
 * Las capturas de la tienda de ejemplo que enseña el sitio comercial.
 *
 * Salen de `scripts/capturas-marketing.mjs`: si se regeneran con otros
 * tamaños, se ajustan aquí `width` y `height`, que son los del archivo
 * pequeño (el grande es el doble).
 */
export interface Shot {
	src: string;
	srcset: string;
	width: number;
	height: number;
	alt: string;
}

function shot(small: string, large: string, width: number, height: number, alt: string): Shot {
	return { src: small, srcset: `${small} ${width}w, ${large} ${width * 2}w`, width, height, alt };
}

export const CAPTURA_PORTADA = shot(
	portada960,
	portada1920,
	960,
	600,
	'Portada de una tienda Globerce de ropa: la colección de temporada con una foto grande.'
);

export const CAPTURA_DESTACADOS = shot(
	destacados960,
	destacados1920,
	960,
	438,
	'Los productos destacados de una tienda Globerce, con fotos, precios y descuentos.'
);

export const CAPTURA_CATALOGO_CELULAR = shot(
	catalogoCelular300,
	catalogoCelular600,
	300,
	649,
	'El catálogo de la tienda en un celular, con filtros y precios.'
);

export const CAPTURA_PRODUCTO_CELULAR = shot(
	productoCelular300,
	productoCelular600,
	300,
	649,
	'La ficha de un producto en un celular, con su precio de oferta y el botón para agregar.'
);
