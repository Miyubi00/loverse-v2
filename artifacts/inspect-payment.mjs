import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5173/payment-status', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
console.log('h1:', await page.locator('h1').first().textContent());
console.log('line:', await page.locator('h1').first().evaluate(el => getComputedStyle(el).lineHeight + ' / ' + getComputedStyle(el).fontFamily));
await page.screenshot({ path: 'artifacts/ui/after/payment-manual-late.png' });
await browser.close();
