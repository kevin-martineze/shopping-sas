import type { Plan, SubscriptionSummary } from '$lib/domain/account';

import { describe, expect, it } from 'vitest';

import { planFeatures, subscriptionNotice, usagePercent } from '$lib/domain/account';

function summary(overrides: Partial<SubscriptionSummary>): SubscriptionSummary {
	return {
		plan: {
			code: 'basico',
			name: 'Básico',
			price_cop: 49000,
			max_products: 100,
			max_orders_per_month: 300,
			max_images_per_product: 6,
			custom_domain: false,
			ai_replies_per_month: 0,
			active: true
		},
		status: 'active',
		store_status: 'active',
		current_period_end: '2026-10-31',
		trial_ends_at: null,
		days_left: 30,
		usage: { products: 10, orders_this_month: 3 },
		self_service_billing: false,
		payments: [],
		...overrides
	};
}

describe('subscriptionNotice', () => {
	it('una tienda al día no muestra aviso', () => {
		expect(subscriptionNotice(summary({}))).toBeNull();
	});

	it('suspendida es lo más grave', () => {
		expect(subscriptionNotice(summary({ store_status: 'suspended', days_left: 10 }))?.tone).toBe(
			'danger'
		);
	});

	it('vencida avisa sin alarmar', () => {
		expect(subscriptionNotice(summary({ store_status: 'past_due', days_left: -2 }))?.tone).toBe(
			'warning'
		);
	});

	it('el aviso dice cómo pagar según haya pasarela o no', () => {
		const vencida = { store_status: 'past_due', days_left: -2 } as const;

		expect(subscriptionNotice(summary(vencida))?.text).toContain('Escríbenos');
		expect(subscriptionNotice(summary({ ...vencida, self_service_billing: true }))?.text).toContain(
			'Tu plan'
		);
	});

	it('la prueba avisa solo en su última semana, en singular cuando toca', () => {
		expect(subscriptionNotice(summary({ store_status: 'trial', days_left: 12 }))).toBeNull();
		expect(subscriptionNotice(summary({ store_status: 'trial', days_left: 1 }))?.text).toContain(
			'1 día '
		);
		expect(subscriptionNotice(summary({ store_status: 'trial', days_left: -1 }))?.tone).toBe(
			'warning'
		);
	});

	it('avisa la renovación cercana de un plan pago', () => {
		expect(subscriptionNotice(summary({ days_left: 2 }))?.text).toContain('2 días');
	});
});

describe('usagePercent', () => {
	it('redondea y no pasa de 100', () => {
		expect(usagePercent(1, 3)).toBe(33);
		expect(usagePercent(150, 100)).toBe(100);
	});

	it('sin límite no hay porcentaje', () => {
		expect(usagePercent(10, null)).toBeNull();
	});
});

describe('planFeatures', () => {
	const basico: Plan = {
		code: 'basico',
		name: 'Básico',
		price_cop: 49000,
		max_products: 100,
		max_orders_per_month: 300,
		max_images_per_product: 6,
		custom_domain: false,
		ai_replies_per_month: 0,
		active: true
	};

	it('un límite se cuenta y se concuerda en plural', () => {
		expect(planFeatures(basico)).toContain('Hasta 100 prendas');
		expect(planFeatures({ ...basico, max_products: 1 })).toContain('Hasta 1 prenda');
	});

	it('sin límite no dice "null"', () => {
		const features = planFeatures({ ...basico, max_products: null, max_orders_per_month: null });

		expect(features).toContain('Prendas sin límite');
		expect(features.join(' ')).not.toContain('null');
	});

	it('el dominio propio solo se promete si el plan lo incluye', () => {
		expect(planFeatures({ ...basico, custom_domain: true })).toContain('Tu propio dominio');
		expect(planFeatures(basico).some((f) => f.includes('globerce.store'))).toBe(true);
	});

	it('el asistente se anuncia con su cuota, y solo donde va incluido', () => {
		const conAsistente = planFeatures({ ...basico, ai_replies_per_month: 500 });

		expect(conAsistente.some((f) => f.includes('Asistente') && f.includes('500'))).toBe(true);
		expect(planFeatures(basico).some((f) => f.includes('Asistente'))).toBe(false);
	});
});
