import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const logo = fs.readFileSync(path.join(root, 'public', 'logo.svg'), 'utf8');
const paths = [...logo.matchAll(/<path\b[^>]*\/>/g)].map((match) => match[0]);

if (!paths.length) {
  throw new Error('No logo paths found in public/logo.svg');
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#190F07"/>
  <svg x="12" y="15" width="40" height="31" viewBox="-12 -14 672 520" preserveAspectRatio="xMidYMid meet" fill="none">
    ${paths.join('\n    ')}
  </svg>
</svg>
`;

fs.writeFileSync(path.join(root, 'public', 'favicon.svg'), favicon);
const dataUrl = `data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}`;
const browser = await chromium.launch({ channel: 'chrome' });

for (const size of [32, 180, 512]) {
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>html,body{margin:0;width:${size}px;height:${size}px;background:transparent}img{display:block;width:${size}px;height:${size}px}</style><img src="${dataUrl}" width="${size}" height="${size}" alt="">`,
  );
  await page.locator('img').screenshot({
    path: path.join(root, 'public', `favicon-${size}x${size}.png`),
    omitBackground: true,
  });
  await page.close();
}

await browser.close();
console.log('Generated public/favicon.svg, favicon-32x32.png, favicon-180x180.png, favicon-512x512.png');
