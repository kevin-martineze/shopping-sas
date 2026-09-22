/**
 * La tienda inventada que sale en las maquetas del sitio comercial —la
 * vitrina, el celular, la ficha de pago— y de ejemplo en el registro.
 *
 * Vive aquí y no repartida por los componentes para que cambiarle el nombre
 * sea tocar una línea. Es un nombre, no una marca real: corto, sin acentos
 * para que quepa en un subdominio, y que suene a una tienda que puede vender
 * cualquier cosa.
 */
export const TIENDA_MAQUETA = {
	nombre: 'Casa Oliva',
	slug: 'casaoliva'
} as const;

/** La dirección que se pinta en la barra del navegador dibujado. */
export const HOST_MAQUETA = `${TIENDA_MAQUETA.slug}.globerce.store`;
