/**
 * La tienda de ejemplo del sitio comercial: la de las maquetas —el celular,
 * la ficha de pago—, la de las capturas (`StoreShowcase`, que pinta esta
 * dirección en la barra del navegador) y la de ejemplo en el registro.
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

/** La dirección que se pinta en la barra del navegador de `StoreShowcase`. */
export const HOST_MAQUETA = `${TIENDA_MAQUETA.slug}.globerce.store`;
