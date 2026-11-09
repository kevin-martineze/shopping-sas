import type { TemplateInfo } from '$lib/domain/templates';

/**
 * Lo que una plantilla decide dentro de cada tarjeta y que CSS no puede
 * resolver: cuántas muestras de color se muestran. Viaja por contexto desde el
 * layout de la tienda, así la tarjeta no necesita saber en qué plantilla está.
 */
export interface CardLook {
	/** Cuántas muestras se muestran; el resto se cuenta como "+N". `null`: todas. */
	readonly swatchLimit: number | null;
}

/** La clave del contexto. Un símbolo: nadie más puede colisionar con ella. */
export const CARD_LOOK = Symbol('card-look');

export function cardLookOf(template: TemplateInfo): CardLook {
	return { swatchLimit: template.card === 'retail' ? 5 : null };
}
