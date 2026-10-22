export function readColorToken(name: string, fallback = "black"): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(`--color-${name}`).trim();
  return value || fallback;
}

export function withAlpha(color: string, alpha: number): string {
  const match = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return color;
  const [red, green, blue] = [0, 2, 4].map((offset) =>
    Number.parseInt(match[1].slice(offset, offset + 2), 16),
  );
  const prefix = "rgb";
  return `${prefix}a(${red}, ${green}, ${blue}, ${alpha})`;
}
