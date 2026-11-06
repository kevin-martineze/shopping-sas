import { beforeEach, describe, expect, it } from 'vitest';

import {
	clearDomainCache,
	getCachedDomain,
	MAX_ENTRIES,
	setCachedDomain,
	TTL_FOUND_MS,
	TTL_MISSING_MS
} from '$lib/server/domain-cache';

const tienda = { slug: 'boutique', status: 'active' as const };

describe('domain-cache', () => {
	beforeEach(() => {
		clearDomainCache();
	});

	it('una tienda encontrada se recuerda 60 s', () => {
		setCachedDomain('sutienda.com', tienda, 1_000);

		expect(getCachedDomain('sutienda.com', 1_000 + TTL_FOUND_MS - 1)).toEqual(tienda);
		expect(getCachedDomain('sutienda.com', 1_000 + TTL_FOUND_MS)).toBeUndefined();
	});

	it('un 404 se recuerda 30 s y se distingue de "no hay nada"', () => {
		setCachedDomain('nadie.com', null, 1_000);

		expect(getCachedDomain('nadie.com', 1_000 + TTL_MISSING_MS - 1)).toBeNull();
		expect(getCachedDomain('nadie.com', 1_000 + TTL_MISSING_MS)).toBeUndefined();
	});

	it('lo que no está guardado devuelve undefined', () => {
		expect(getCachedDomain('nunca.com', 0)).toBeUndefined();
	});

	it('al llegar al tope, sale la entrada más antigua', () => {
		for (let i = 0; i < MAX_ENTRIES; i++) {
			setCachedDomain(`d${i}.com`, tienda, 0);
		}

		setCachedDomain('nuevo.com', tienda, 0);

		expect(getCachedDomain('d0.com', 0)).toBeUndefined();
		expect(getCachedDomain('d1.com', 0)).toEqual(tienda);
		expect(getCachedDomain('nuevo.com', 0)).toEqual(tienda);
	});

	it('volver a guardar un host no lo duplica ni lo echa del tope', () => {
		for (let i = 0; i < MAX_ENTRIES; i++) {
			setCachedDomain(`d${i}.com`, tienda, 0);
		}

		setCachedDomain('d5.com', null, 0);

		expect(getCachedDomain('d5.com', 0)).toBeNull();
		expect(getCachedDomain('d0.com', 0)).toEqual(tienda);
	});
});
