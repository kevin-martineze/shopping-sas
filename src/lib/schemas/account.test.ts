import { describe, expect, it } from 'vitest';

import { registerSchema, resetPasswordSchema } from '$lib/schemas/account';

const valid = {
	storeName: 'Casa Oliva',
	storeSlug: 'Casa-Oliva',
	fullName: 'María',
	email: ' Maria@Tienda.COM ',
	whatsappPhone: '+57 300 123 4567',
	password: 'una contraseña larga',
	confirm: 'una contraseña larga'
};

describe('registerSchema', () => {
	it('normaliza la dirección, el correo y el WhatsApp', () => {
		const parsed = registerSchema.parse(valid);

		expect(parsed.storeSlug).toBe('casa-oliva');
		expect(parsed.email).toBe('maria@tienda.com');
		expect(parsed.whatsappPhone).toBe('573001234567');
	});

	it('rechaza una dirección que no sirve como subdominio', () => {
		expect(registerSchema.safeParse({ ...valid, storeSlug: 'mi.tienda' }).success).toBe(false);
		expect(registerSchema.safeParse({ ...valid, storeSlug: '-tienda' }).success).toBe(false);
	});

	it('exige que la confirmación coincida', () => {
		const result = registerSchema.safeParse({ ...valid, confirm: 'otra cosa distinta' });

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.path).toEqual(['confirm']);
	});
});

describe('resetPasswordSchema', () => {
	it('exige doce caracteres', () => {
		const result = resetPasswordSchema.safeParse({
			token: 'x'.repeat(40),
			password: 'corta',
			confirm: 'corta'
		});

		expect(result.success).toBe(false);
	});
});
