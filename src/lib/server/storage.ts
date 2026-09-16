import { deleteProductImage } from '$lib/server/images';

/**
 * Borra archivos de fotos del almacenamiento sin frenar la acción.
 *
 * Se llama DESPUÉS de que la API confirmó que la fila ya no existe. Si el
 * borrado del archivo falla, queda un archivo huérfano en Storage —espacio
 * perdido—, que es mucho mejor que una prenda apuntando a una foto que no está.
 */
export async function deleteStoredImages(paths: string[]): Promise<void> {
	await Promise.all(
		paths.map((path) =>
			deleteProductImage(path).catch((cause: unknown) => {
				console.warn(
					`No se pudo borrar ${path} del almacenamiento:`,
					cause instanceof Error ? cause.message : cause
				);
			})
		)
	);
}
