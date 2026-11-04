/**
 * La foto que la dueña acaba de elegir, servida desde el navegador.
 *
 * El panel manda un `Blob` por `postMessage` (structured clone) y la tienda lo
 * convierte en un `blob:` con `URL.createObjectURL`. Ese `blob:` hay que
 * revocarlo cuando la foto cambia o el componente se destruye; si no, el
 * navegador se queda con cada versión en memoria mientras la dueña edita.
 *
 * Se devuelve un objeto con un getter para que leer `.current` dentro de un
 * `$derived` o de la plantilla siga siendo reactivo.
 */
export function draftImageUrl(image: () => Blob | null): { readonly current: string | null } {
	let url = $state<string | null>(null);

	$effect(() => {
		const blob = image();

		if (!blob) {
			url = null;
			return;
		}

		const objectUrl = URL.createObjectURL(blob);
		url = objectUrl;

		return () => URL.revokeObjectURL(objectUrl);
	});

	return {
		get current() {
			return url;
		}
	};
}
