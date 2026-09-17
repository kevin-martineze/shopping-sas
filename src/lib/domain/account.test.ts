import type { SubscriptionSummary } from '$lib/domain/account';

import { describe, expect, it } from 'vitest';

import { subscriptionNotice, usagePercent } from '$lib/domain/account';

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
			active: true
		},
		status: 'active',
		store_status: 'active',
		current_period_end: '2026-10-31',
		trial_ends_at: null,
		days_left: 30,
		usage: { products: 10, orders_this_month: 3 },
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
