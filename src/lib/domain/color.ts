/**
 * Conversión entre `#RRGGBB` y HSV, que es como se piensa un selector de color:
 * un tono (0–360) y, dentro de él, cuánto color (`s`) y cuánta luz (`v`),
 * los dos de 0 a 1.
 */
export interface Hsv {
	h: number;
	s: number;
	v: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function hexToHsv(hex: string): Hsv {
	const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255;

	const max = Math.max(r, g, b);
	const delta = max - Math.min(r, g, b);

	let h = 0;

	if (delta > 0) {
		if (max === r) h = ((g - b) / delta) % 6;
		else if (max === g) h = (b - r) / delta + 2;
		else h = (r - g) / delta + 4;
	}

	return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToHex({ h, s, v }: Hsv): string {
	const hue = ((h % 360) + 360) % 360;
	const sat = clamp(s, 0, 1);
	const val = clamp(v, 0, 1);

	const channel = (n: number) => {
		const k = (n + hue / 60) % 6;
		const value = val - val * sat * Math.max(0, Math.min(k, 4 - k, 1));

		return Math.round(value * 255)
			.toString(16)
			.padStart(2, '0');
	};

	return `#${channel(5)}${channel(3)}${channel(1)}`.toUpperCase();
}
