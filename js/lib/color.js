/* Couleur : contraste WCAG et correction en OKLCH (même teinte, clarté ajustée). */

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex) {
  const h = String(hex).replace('#', '');
  const f = h.length === 3 ? h.split('').map((x) => x + x).join('') : h;
  return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16) / 255);
}
export function rgbToHex(rgb) {
  return '#' + rgb.map((x) => Math.round(Math.min(1, Math.max(0, x)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}
export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
export const ratio = (r) => `${r.toFixed(2).replace('.', ',')}:1`;

function toOklch(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), Math.atan2(B, A)];
}
function fromOklch(L, C, h) {
  const tryC = (c) => {
    const a = c * Math.cos(h); const b = c * Math.sin(h);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  };
  let c = C; let rgb = tryC(c);
  while (c > 0 && rgb.some((x) => x < -1e-4 || x > 1 + 1e-4)) { c -= 0.004; rgb = tryC(c); }
  return rgbToHex(rgb.map(toSrgb));
}

/* Ajuste la clarté jusqu'à atteindre `min` contre chacun des fonds ; garde la teinte. */
export function ensureContrast(hex, bgs, min) {
  const list = [].concat(bgs);
  const ok = (c) => list.every((b) => contrast(c, b) >= min);
  if (!hex || !/^#?[0-9a-f]{3,6}$/i.test(hex) || ok(hex)) return hex;
  const [L, C, h] = toOklch(hex);
  const darkBg = list.every((b) => luminance(b) < 0.18);
  for (let i = 1; i <= 100; i++) {
    const nl = darkBg ? Math.min(1, L + i * 0.01) : Math.max(0, L - i * 0.01);
    const c = fromOklch(nl, C, h);
    if (ok(c)) return c;
  }
  return darkBg ? '#FFFFFF' : '#000000';
}
