// #RRGGBB / #RRGGBBAA <-> hue (0-360), saturation and lightness (0-100), alpha (0-255)
export type Hsla = { h: number, s: number, l: number, a: number };

const byte = (hex: string) => parseInt(hex, 16);
const toHex = (value: number) => Math.round(value).toString(16).padStart(2, '0').toUpperCase();

export const normalizeHex = (value: string) => {
    const hex = value.replace('#', '').toUpperCase();
    return `#${hex.length === 6 ? `${hex}FF` : hex}`;
};

export const hexToHsla = (value: string): Hsla => {
    const hex = normalizeHex(value).slice(1);
    const [r, g, b] = [0, 2, 4].map((i) => byte(hex.slice(i, i + 2)) / 255);
    const a = byte(hex.slice(6, 8));
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const d = max - min;
    if (d === 0) return { h: 0, s: 0, l: Math.round(l * 100), a };
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return { h: Math.round((h * 60 + 360) % 360), s: Math.round(s * 100), l: Math.round(l * 100), a };
};

export const hslaToHex = ({ h, s, l, a }: Hsla) => {
    const sat = s / 100;
    const light = l / 100;
    const k = (n: number) => (n + h / 30) % 12;
    const f = (n: number) => light - sat * Math.min(light, 1 - light) * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return `#${toHex(f(0) * 255)}${toHex(f(8) * 255)}${toHex(f(4) * 255)}${toHex(a)}`;
};
