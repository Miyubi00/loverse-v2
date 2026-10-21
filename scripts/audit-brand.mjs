import { chromium } from '@playwright/test';

const BASE = process.env.CAPTURE_BASE || 'http://127.0.0.1:5173';
const ADMIN_PATH = process.env.CAPTURE_ADMIN_PATH || '/panel-daffa11';
const RATIO = 680 / 220;
const TOLERANCE = 0.01;

const routes = [
  '/',
  '/order',
  '/order/success',
  '/login',
  '/forgot-pin',
  '/forgot-pin/confirm',
  '/payment-status',
  '/contact',
  '/portfolio',
  '/tutorial',
  '/privacy',
  '/terms',
  '/dev/email',
  '/dev/invoice',
  ADMIN_PATH,
  '/route-yang-tidak-ada',
];

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const failures = [];

for (const route of routes) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1200);
  const result = await page.evaluate(({ ratio, tolerance }) => {
    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const images = [...document.querySelectorAll('img')]
      .filter((img) => /(^|\/)logo\.png(?:$|[?#])/.test(img.getAttribute('src') || ''))
      .filter(isVisible);
    const imageChecks = images.map((img) => {
      const rect = img.getBoundingClientRect();
      const renderedRatio = rect.width / rect.height;
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      return {
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt'),
        width: img.getAttribute('width'),
        height: img.getAttribute('height'),
        renderedRatio,
        naturalRatio,
        ratioOk: Math.abs(renderedRatio / ratio - 1) <= tolerance,
        naturalOk: Math.abs(naturalRatio / ratio - 1) <= tolerance,
      };
    });
    const brandLinks = [...document.querySelectorAll('a[aria-label*="Loverse" i]')].filter(isVisible);
    const fakeLogoText = [...document.querySelectorAll('span,p,h1,h2,h3,h4,h5,h6,strong,b')]
      .filter(isVisible)
      .filter((el) => /^(loverse|loverse\.)$/i.test((el.textContent || '').trim()))
      .map((el) => `${el.tagName}:${el.textContent?.trim()}`);
    const headerHasImageBrand =
      !document.querySelector('header') ||
      Boolean(document.querySelector('header a[aria-label*="Loverse" i] img[src*="/logo.png"]'));
    const favicon = document.querySelector('link[rel="icon"][href="/favicon.svg"]');
    return {
      imageChecks,
      brandLinks: brandLinks.length,
      fakeLogoText,
      headerHasImageBrand,
      favicon: Boolean(favicon),
    };
  }, { ratio: RATIO, tolerance: TOLERANCE });

  if (!result.imageChecks.length) failures.push(`${route}: no visible /logo.png lockup`);
  for (const image of result.imageChecks) {
    if (!image.ratioOk) failures.push(`${route}: rendered logo ratio ${image.renderedRatio.toFixed(3)} != ${RATIO.toFixed(3)}`);
    if (!image.naturalOk) failures.push(`${route}: natural logo ratio ${image.naturalRatio.toFixed(3)} != ${RATIO.toFixed(3)}`);
    if (image.width !== '680' || image.height !== '220') failures.push(`${route}: logo lacks 680x220 dimensions`);
    if (image.alt !== 'Loverse') failures.push(`${route}: logo alt is "${image.alt}"`);
  }
  if (!result.brandLinks) failures.push(`${route}: no accessible brand link`);
  if (result.fakeLogoText.length) failures.push(`${route}: typographic logo found (${result.fakeLogoText.join(', ')})`);
  if (!result.headerHasImageBrand) failures.push(`${route}: header brand is not the official image lockup`);
  if (!result.favicon) failures.push(`${route}: /favicon.svg is not linked`);
}

await browser.close();

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`Brand audit passed on ${routes.length} routes.`);
