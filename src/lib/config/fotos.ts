import clientaNoche1376 from '$lib/assets/marketing/clienta-noche-1376.webp';
import clientaNoche688 from '$lib/assets/marketing/clienta-noche-688.webp';
import emprendedora464 from '$lib/assets/marketing/emprendedora-taller-464.webp';
import emprendedora928 from '$lib/assets/marketing/emprendedora-taller-928.webp';
import productoBlusa400 from '$lib/assets/marketing/producto-blusa-400.webp';
import productoBlusa800 from '$lib/assets/marketing/producto-blusa-800.webp';
import productoCafe400 from '$lib/assets/marketing/producto-cafe-400.webp';
import productoCafe800 from '$lib/assets/marketing/producto-cafe-800.webp';
import productoLibro400 from '$lib/assets/marketing/producto-libro-400.webp';
import productoLibro800 from '$lib/assets/marketing/producto-libro-800.webp';
import rubroCafe1024 from '$lib/assets/marketing/rubro-cafe-1024.webp';
import rubroCafe512 from '$lib/assets/marketing/rubro-cafe-512.webp';
import rubroLibros1024 from '$lib/assets/marketing/rubro-libros-1024.webp';
import rubroLibros512 from '$lib/assets/marketing/rubro-libros-512.webp';
import rubroRopa1024 from '$lib/assets/marketing/rubro-ropa-1024.webp';
import rubroRopa512 from '$lib/assets/marketing/rubro-ropa-512.webp';
import { shot } from '$lib/config/capturas';

/**
 * Las fotos de ambiente del sitio comercial: productos, rubros y personas.
 *
 * A diferencia de las capturas, no salen de una tienda: son imágenes
 * generadas con Gemini, en una misma paleta (crema, terracota, verde salvia,
 * madera) para que se lean como una sola sesión de fotos. Van en WebP, en dos
 * anchos, recortadas a la proporción en que se pintan.
 *
 * Las que solo ambientan —el fondo de un rubro, la foto del cierre— llevan
 * `alt` vacío: el texto de al lado ya dice lo mismo.
 */

export const FOTO_PRODUCTO = {
	ropa: shot(productoBlusa400, productoBlusa800, 400, 300, ''),
	cafe: shot(productoCafe400, productoCafe800, 400, 300, ''),
	unico: shot(productoLibro400, productoLibro800, 400, 300, '')
};

export const FOTO_RUBRO = {
	ropa: shot(rubroRopa512, rubroRopa1024, 512, 512, ''),
	cafe: shot(rubroCafe512, rubroCafe1024, 512, 512, ''),
	unico: shot(rubroLibros512, rubroLibros1024, 512, 512, '')
};

export const FOTO_EMPRENDEDORA = shot(
	emprendedora464,
	emprendedora928,
	464,
	580,
	'Una emprendedora en su taller de ropa empaca un pedido mientras lo revisa en el celular.'
);

export const FOTO_CLIENTA_NOCHE = shot(clientaNoche688, clientaNoche1376, 688, 387, '');
