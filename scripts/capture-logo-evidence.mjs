import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.CAPTURE_BASE || 'http://127.0.0.1:5173';
const PHASE = process.env.LOGO_PHASE || 'before';
const OUT = path.join('artifacts', 'ui', 'revision', PHASE);
const ADMIN_PATH = process.env.CAPTURE_ADMIN_PATH || '/panel-daffa11';

const ROUTES = [
  { name: 'home-header', path: '/', selector: 'header' },
  { name: 'home-footer', path: '/', selector: 'footer' },
  { name: 'login', path: '/login', viewport: true },
  { name: 'forgot-pin', path: '/forgot-pin', viewport: true },
  { name: 'admin-login', path: ADMIN_PATH, viewport: true },
  { name: 'order-success', path: '/order/success', viewport: true },
  { name: 'email-preview', path: '/dev/email', selector: 'body' },
  { name: 'invoice-preview', path: '/dev/invoice', selector: 'body' },
];

await fs.promises.mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });

for (const size of [
  { label: 'mobile', width: 390, height: 844 },
  { label: 'desktop', width: 1440, height: 900 },
]) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
    locale: 'id-ID',
  });
  const page = await context.newPage();
  for (const route of ROUTES) {
    try {
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(1800);
      const target = route.selector ? page.locator(route.selector).first() : null;
      if (target && (await target.count()) && (await target.isVisible().catch(() => false))) {
        await target.screenshot({ path: path.join(OUT, `${route.name}-${size.label}.png`) });
      } else {
        await page.screenshot({ path: path.join(OUT, `${route.name}-${size.label}.png`) });
      }
      console.log(`OK ${route.name}-${size.label}`);
    } catch (error) {
      console.error(`FAIL ${route.name}-${size.label}: ${error.message}`);
    }
  }
  await context.close();
}

await browser.close();
