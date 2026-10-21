import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const src = path.join(root, "src");
const css = fs.readFileSync(path.join(src, "index.css"), "utf8");

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "templates" || entry.name === "three") continue;
      walk(full);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
}
walk(src);

const failures = [];
const rawColor = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/;
const foreignPalette =
  /\b(?:emerald|amber|rose|stone|slate|gray|zinc|neutral|red|green|blue|orange|yellow|indigo|violet|purple|pink|teal|cyan|lime|fuchsia)-\d{2,3}\b/;
const bracketToken =
  /\[(?:ink|cream|peach|ember|gold|success|danger|whatsapp|wine|forest)-\d{2,3}/;

for (const file of files) {
  const rel = path.relative(root, file).replaceAll("\\", "/");
  const text = fs.readFileSync(file, "utf8");
  text.split(/\r?\n/).forEach((line, index) => {
    if (rawColor.test(line)) {
      failures.push(`${rel}:${index + 1} raw color value`);
    }
    if (foreignPalette.test(line)) {
      failures.push(`${rel}:${index + 1} non-brand Tailwind palette`);
    }
    if (bracketToken.test(line)) {
      failures.push(`${rel}:${index + 1} invalid bracketed token`);
    }
  });
}

function token(name) {
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Missing token --color-${name}`);
  return match[1];
}

function luminance(hex) {
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrast(foreground, background) {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

const required = {
  "ink-950": "#190f07",
  "ink-900": "#281b10",
  "ink-500": "#75604e",
  "ink-400": "#7d6958",
  "cream-100": "#ffefe2",
  "cream-50": "#fff9f2",
  "peach-300": "#ffd6b2",
  "ember-500": "#bf7523",
  "ember-600": "#9d5800",
  "gold-600": "#875726",
  "success-700": "#325b3b",
  "danger-600": "#a43c33",
  "whatsapp-600": "#17843f",
};

for (const [name, expected] of Object.entries(required)) {
  const actual = token(name);
  if (actual.toLowerCase() !== expected) {
    failures.push(`token --color-${name} is ${actual}, expected ${expected}`);
  }
}

const pairs = [
  ["ink-900", "cream-100", 4.5],
  ["ink-500", "cream-100", 4.5],
  ["ink-400", "cream-100", 4.5],
  ["ink-400", "cream-50", 4.5],
  ["ember-600", "cream-100", 4.5],
  ["gold-600", "white", 4.5],
  ["success-700", "white", 4.5],
  ["danger-600", "white", 4.5],
  ["ember-500", "cream-100", 3],
  ["whatsapp-600", "cream-100", 3],
];

for (const [foreground, background, minimum] of pairs) {
  const foregroundHex = foreground === "white" ? "#ffffff" : token(foreground);
  const backgroundHex = background === "white" ? "#ffffff" : token(background);
  const ratio = contrast(foregroundHex, backgroundHex);
  if (ratio < minimum) {
    failures.push(
      `${foreground} on ${background} is ${ratio.toFixed(2)}:1, minimum ${minimum}:1`,
    );
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `Color audit passed: ${files.length} app files, 0 raw colors, 0 foreign palette classes, ${pairs.length} contrast pairs.`,
);
