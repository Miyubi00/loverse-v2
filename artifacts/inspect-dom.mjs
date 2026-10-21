import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const info = await page.evaluate(() => ({
  height: document.documentElement.scrollHeight,
  sections: Array.from(document.querySelectorAll('main section, main > div > section')).map((el) => ({ id: el.id, top: Math.round(el.getBoundingClientRect().top + window.scrollY), h: Math.round(el.getBoundingClientRect().height), text: (el.querySelector('h1,h2')?.textContent || '').trim().slice(0, 50) })),
  mains: document.querySelectorAll('main').length,
  appChildren: document.getElementById('root')?.children.length,
}));
console.log(JSON.stringify(info, null, 2));
await browser.close();
