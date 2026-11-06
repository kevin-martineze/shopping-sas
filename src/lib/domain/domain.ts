/**
 * Dominio propio de una tienda: tipos y textos. Los estados internos van en
 * inglés, como el resto de la API; la etiqueta es lo que ve la dueña.
 */

export const DOMAIN_STATUSES = ['pending', 'active', 'failed', 'disabled'] as const;

export type DomainStatus = (typeof DOMAIN_STATUSES)[number];
