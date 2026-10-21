import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [name, url] of [['home','http://127.0.0.1:5173/'],['login','http://127.0.0.1:5173/login']]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', m => { if (m.type() === 'error') console.log(name, 'CONSOLE:', m.text().slice(0,300)); });
  page.on('pageerror', e => console.log(name, 'PAGEERROR:', String(e).slice(0,300)));
  page.on('requestfailed', r => console.log(name, 'REQFAIL:', r.url().slice(0,180)));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.close();
}
await browser.close();
