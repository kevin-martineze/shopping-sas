/**
 * Destino seguro para un `?redirectTo=` que llega en la URL.
 *
 * Solo acepta rutas de este mismo sitio. Sin esto, el login es un redirector
 * abierto: un enlace a `/admin/login?redirectTo=https://otro-sitio` lleva a la
 * dueña, recién autenticada y confiada, a una página que imita el panel.
 * `//otro-sitio` y `/\otro-sitio` también cuentan como externos: los
 * navegadores los resuelven a otro dominio.
 */
export function safeRedirectTarget(value: string | null, fallback = '/admin'): string {
	if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) {
		return fallback;
	}

	return value;
}
