import { browser } from '$app/environment';

const STORAGE_KEY = 'tienda:favorites:v1';

/** Favoritos por slug de producto: sobreviven a cambios de precio y de stock. */
class Favorites {
	slugs = $state<string[]>([]);

	count = $derived(this.slugs.length);

	hydrate() {
		if (!browser) return;

		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (!raw) return;

			const parsed: unknown = JSON.parse(raw);
			if (!Array.isArray(parsed)) return;

			this.slugs = parsed.filter((slug): slug is string => typeof slug === 'string');
		} catch {
			this.slugs = [];
		}
	}

	has(slug: string): boolean {
		return this.slugs.includes(slug);
	}

	toggle(slug: string) {
		this.slugs = this.has(slug)
			? this.slugs.filter((item) => item !== slug)
			: [...this.slugs, slug];

		this.persist();
	}

	private persist() {
		if (!browser) return;

		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.slugs));
		} catch {
			// Sin storage disponible los favoritos duran lo que la pestaña.
		}
	}
}

export const favorites = new Favorites();
