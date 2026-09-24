/**
 * La tarjeta con que se paga la suscripción.
 *
 * Todo lo de este archivo corre en el navegador y nada de lo que toca llega a
 * nuestro servidor: el número se le entrega a la pasarela con su llave pública
 * y lo que vuelve —y lo único que viaja hacia acá— es un token de un solo uso.
 *
 * Las comprobaciones de abajo no reemplazan a la pasarela, que es quien de
 * verdad dice si una tarjeta sirve. Están para que un dígito mal tecleado se
 * vea al instante y no después de un viaje de ida y vuelta.
 */
export interface CardInput {
	number: string;
	/** Como se escribe: `MM/AA`. */
	expiry: string;
	cvc: string;
	holder: string;
}

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'diners' | 'desconocida';

/** Solo los dígitos: la gente escribe espacios, guiones y a veces puntos. */
export function cardDigits(raw: string): string {
	return raw.replace(/\D/g, '');
}

/**
 * La marca, por el prefijo.
 *
 * Solo para decidir cómo se agrupa el número y cuánto mide el código: quién
 * cobra y si la tarjeta existe lo resuelve la pasarela.
 */
export function cardBrand(raw: string): CardBrand {
	const digits = cardDigits(raw);

	if (/^4/.test(digits)) return 'visa';
	if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
	if (/^3[47]/.test(digits)) return 'amex';
	if (/^3(0[0-5]|[68])/.test(digits)) return 'diners';

	return 'desconocida';
}

/** American Express va en 4-6-5 y lleva código de cuatro; el resto, de a cuatro. */
export function formatCardNumber(raw: string): string {
	const digits = cardDigits(raw).slice(0, 19);

	if (cardBrand(digits) === 'amex') {
		return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
			.filter((parte) => parte.length > 0)
			.join(' ');
	}

	return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Se escribe `1228` y queda `12/28`, sin pelear con la barra al borrar. */
export function formatExpiry(raw: string): string {
	const digits = cardDigits(raw).slice(0, 4);

	if (digits.length <= 2) return digits;

	return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/**
 * El dígito de control de Luhn.
 *
 * Lo cumple cualquier tarjeta del mundo, así que un número que no lo cumple
 * está mal tecleado seguro. Que lo cumpla no dice nada: es una suma, no un banco.
 */
export function luhn(raw: string): boolean {
	const digits = cardDigits(raw);

	if (digits.length < 12) return false;

	let suma = 0;
	let doblar = false;

	for (let i = digits.length - 1; i >= 0; i -= 1) {
		let valor = Number(digits[i]);

		if (doblar) {
			valor *= 2;
			if (valor > 9) valor -= 9;
		}

		suma += valor;
		doblar = !doblar;
	}

	return suma % 10 === 0;
}

/** Mes y año de dos cifras, o `null` si no se entiende o ya pasó. */
export function parseExpiry(
	raw: string,
	now: Date = new Date()
): { month: number; year: number } | null {
	const digits = cardDigits(raw);

	if (digits.length !== 4) return null;

	const month = Number(digits.slice(0, 2));
	const year = Number(digits.slice(2));

	if (month < 1 || month > 12) return null;

	// Una tarjeta vence al final de su mes, no al principio.
	const vence = new Date(Date.UTC(2000 + year, month, 1));

	return vence.getTime() > now.getTime() ? { month, year } : null;
}

export type CardErrors = Partial<Record<keyof CardInput, string>>;

/** Lo que se ve mal sin preguntarle a nadie. Vacío si todo pasa. */
export function validateCard(card: CardInput, now: Date = new Date()): CardErrors {
	const errors: CardErrors = {};
	const digits = cardDigits(card.number);
	const esperado = cardBrand(digits) === 'amex' ? 4 : 3;

	if (digits.length < 12 || !luhn(digits)) {
		errors.number = 'Revisa el número de la tarjeta.';
	}

	if (!parseExpiry(card.expiry, now)) {
		errors.expiry = 'Revisa el vencimiento, como 09/29.';
	}

	if (cardDigits(card.cvc).length !== esperado) {
		errors.cvc = `El código son ${esperado} dígitos, al respaldo.`;
	}

	if (card.holder.trim().length < 3) {
		errors.holder = 'Escribe el nombre tal como está en la tarjeta.';
	}

	return errors;
}

/** Si la tarjeta está vacía del todo: no se validan campos que nadie tocó. */
export function cardIsEmpty(card: CardInput): boolean {
	return [card.number, card.expiry, card.cvc, card.holder].every(
		(valor) => valor.trim().length === 0
	);
}

export interface TokenizeSetup {
	api_url: string;
	public_key: string;
}

/**
 * Cambia la tarjeta por un token, hablando directo con la pasarela.
 *
 * Es la única llamada del sitio que sale del navegador a alguien que no somos
 * nosotros, y es a propósito: si el número pasara por nuestro servidor, nuestro
 * servidor tendría que cumplir PCI. Así no lo toca nadie más que la pasarela.
 */
export async function tokenizeCard(setup: TokenizeSetup, card: CardInput): Promise<string> {
	const expiry = parseExpiry(card.expiry);

	if (!expiry) throw new Error('Revisa el vencimiento de la tarjeta.');

	// Sin dirección no hay pasarela a la que llamar: es la pasarela simulada,
	// la de desarrollo y demostraciones. El token se arma acá con los cuatro
	// últimos, que es lo que ella devuelve como `last4`.
	if (setup.api_url === '') {
		return `sim_${cardDigits(card.number).slice(-4)}`;
	}

	const response = await fetch(`${setup.api_url}/tokens/cards`, {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			authorization: `Bearer ${setup.public_key}`
		},
		body: JSON.stringify({
			number: cardDigits(card.number),
			cvc: cardDigits(card.cvc),
			exp_month: String(expiry.month).padStart(2, '0'),
			exp_year: String(expiry.year).padStart(2, '0'),
			card_holder: card.holder.trim()
		})
	});

	const body: unknown = await response.json().catch(() => null);
	const id = tokenId(body);

	// El mensaje de la pasarela viene en inglés y habla de campos que acá no se
	// llaman así. Se dice lo único accionable: revisa los datos.
	if (!response.ok || !id) {
		throw new Error('No pudimos validar tu tarjeta. Revisa los datos e inténtalo otra vez.');
	}

	return id;
}

function tokenId(body: unknown): string | null {
	if (body === null || typeof body !== 'object') return null;

	const data = (body as { data?: unknown }).data;

	if (data === null || typeof data !== 'object') return null;

	const id = (data as { id?: unknown }).id;

	return typeof id === 'string' && id.length > 0 ? id : null;
}
