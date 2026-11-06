/**
 * Dominio propio de una tienda: tipos y textos. Los estados internos van en
 * inglés, como el resto de la API; la etiqueta es lo que ve la dueña.
 */

export const DOMAIN_STATUSES = ['pending', 'active', 'failed', 'disabled'] as const;

export type DomainStatus = (typeof DOMAIN_STATUSES)[number];

export const DOMAIN_STATUS_LABEL: Record<DomainStatus, string> = {
	pending: 'Falta el DNS',
	active: 'Activo',
	failed: 'Dejó de funcionar',
	disabled: 'Desactivado por el plan'
};

export type DnsRecordType = 'A' | 'CNAME' | 'TXT';

/** Un registro que la dueña pone en el DNS de su dominio. `name` es relativo a la zona (`www`, `@`). */
export interface DnsRecord {
	type: DnsRecordType;
	name: string;
	value: string;
}

export interface StoreDomain {
	host: string;
	status: DomainStatus;
	dns_records: DnsRecord[];
	verified_at: string | null;
	last_error: string | null;
}

/** Lo que el panel muestra: si el plan lo permite y el dominio actual, si hay uno. */
export interface DomainState {
	allowed: boolean;
	domain: StoreDomain | null;
}
