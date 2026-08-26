import { browser } from '$app/environment';

const STORAGE_KEY = 'tienda:cart:v1';
const MAX_QTY_PER_LINE = 20;

/**
 * Línea del carrito tal como vive en el navegador: solo identificador y
 * cantidad. Nunca guardamos precios — los recalcula el servidor en cada paso,
 * así un carrito viejo no puede comprar a precio viejo.
 */
export interface CartLine {
	variantId: string;
	qty: number;
	/** Solo para pintar el drawer sin ir al servidor; no es fuente de verdad. */
	preview: {
		productName: string;
		productSlug: string;
		colorName: string;
		sizeLabel: string;
		unitPrice: number;
		imageUrl: string | null;
	};
}

function readStorage(): CartLine[] {
	if (!browser) return [];

	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];

		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];

		return parsed.filter(isCartLine);
	} catch {
		// Storage corrupto o bloqueado: se arranca con carrito vacío.
		return [];
	}
}

function isCartLine(value: unknown): value is CartLine {
	if (typeof value !== 'object' || value === null) return false;

	const line: Record<string, unknown> = { ...value };
	const preview = line.preview;

	return (
		typeof line.variantId === 'string' &&
		typeof line.qty === 'number' &&
		line.qty > 0 &&
		typeof preview === 'object' &&
		preview !== null
	);
}

class Cart {
	lines = $state<CartLine[]>([]);
	/** El drawer se abre solo al agregar; se controla desde aquí. */
	open = $state(false);

	count = $derived(this.lines.reduce((sum, line) => sum + line.qty, 0));
	/** Subtotal orientativo para el drawer. El definitivo lo calcula el servidor. */
	previewSubtotal = $derived(
		this.lines.reduce((sum, line) => sum + line.preview.unitPrice * line.qty, 0)
	);
	isEmpty = $derived(this.lines.length === 0);

	hydrate() {
		this.lines = readStorage();
	}

	persist() {
		if (!browser) return;

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.lines));
		} catch {
			// Modo privado con storage lleno: el carrito sigue funcionando en memoria.
		}
	}

	add(line: CartLine, options?: { openDrawer?: boolean }) {
		const existing = this.lines.find((item) => item.variantId === line.variantId);

		if (existing) {
			existing.qty = Math.min(existing.qty + line.qty, MAX_QTY_PER_LINE);
			existing.preview = line.preview;
		} else {
			this.lines.push({ ...line, qty: Math.min(line.qty, MAX_QTY_PER_LINE) });
		}

		this.persist();

		if (options?.openDrawer !== false) this.open = true;
	}

	setQty(variantId: string, qty: number) {
		if (qty <= 0) {
			this.remove(variantId);
			return;
		}

		const line = this.lines.find((item) => item.variantId === variantId);
		if (!line) return;

		line.qty = Math.min(qty, MAX_QTY_PER_LINE);
		this.persist();
	}

	remove(variantId: string) {
		this.lines = this.lines.filter((line) => line.variantId !== variantId);
		this.persist();
	}

	clear() {
		this.lines = [];
		this.persist();
	}

	/** Formato que espera la form action del carrito. */
	serialize(): string {
		return JSON.stringify(this.lines.map((line) => ({ variantId: line.variantId, qty: line.qty })));
	}
}

export const cart = new Cart();
