import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { ADMIN_PATH, mockAdmin } from "../scripts/ui-mocks.mjs";

const BASE = "http://127.0.0.1:5173";
const OUT = "artifacts/ui/revision/admin-topbar";
await fs.promises.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-gpu", "--font-render-hinting=none"],
});

async function inspect(width, height, capture) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: "id-ID",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await mockAdmin(page);
  await page.goto(`${BASE}${ADMIN_PATH}?tab=orders`, {
    waitUntil: "domcontentloaded",
    timeout: 45000,
  });
  await page.waitForTimeout(2600);

  const main = await page.evaluate(() => {
    const header = [...document.querySelectorAll("header")].find((element) => {
      const rect = element.getBoundingClientRect();
      return getComputedStyle(element).display !== "none" && rect.height > 0 && rect.top === 0;
    });
    if (!header) throw new Error("Topbar not found");
    const rectOf = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    };
    const logo = header.querySelector('img[src="/logo.png"]');
    const hamburger = header.querySelector('button[aria-label="Menu"]');
    const language = header.querySelector('[role="group"]');
    const buttons = [...header.querySelectorAll("button")];
    const aside = document.querySelector("aside");
    const topbarText = header.textContent.replace(/\s+/g, " ").trim();
    const pageOverflow = document.documentElement.scrollWidth > window.innerWidth + 1;
    const topbarChildren = [...header.children].map((element) => ({
      tag: element.tagName.toLowerCase(),
      rect: rectOf(element),
      text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 80),
    }));
    return {
      width: window.innerWidth,
      header: rectOf(header),
      logo: rectOf(logo),
      hamburger: rectOf(hamburger),
      language: rectOf(language),
      buttons: buttons.map((button) => ({
        label: button.getAttribute("aria-label"),
        pressed: button.getAttribute("aria-pressed"),
        rect: rectOf(button),
      })),
      topbarText,
      topbarChildren,
      pageOverflow,
      asideText: (aside?.textContent || "").replace(/\s+/g, " ").trim(),
      hasSidebarLogo: Boolean(aside?.querySelector('img[src="/logo.png"]')),
      hasSidebarLanguage: Boolean(aside?.querySelector('[role="group"]')),
      hasRemovedMeta: /superuser|secure/i.test(aside?.textContent || ""),
      headerHasEmail: (header.textContent || "").includes("admin@loverse.com"),
      headerHasAdminLabel: /admin\s*\/\s*admin panel/i.test(header.textContent || ""),
    };
  });

  if (capture) {
    await page.screenshot({ path: path.join(OUT, `admin-${width}.png`) });
  }

  if (width < 1024) {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.waitForTimeout(450);
    const drawer = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const rect = aside.getBoundingClientRect();
      return {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        text: aside.textContent.replace(/\s+/g, " ").trim(),
        hasLanguage: Boolean(aside.querySelector('[role="group"]')),
        hasEmail: (aside.textContent || "").includes("admin@loverse.com"),
        hasLogout: /keluar/i.test(aside.textContent || ""),
      };
    });
    if (capture) {
      await page.screenshot({ path: path.join(OUT, `admin-${width}-drawer.png`) });
    }
    console.log(`DRAWER ${width}`, JSON.stringify(drawer));
  }

  console.log(`MAIN ${width}`, JSON.stringify(main));
  await context.close();
}

await inspect(1440, 900, true);
await inspect(390, 844, true);
await inspect(360, 844, true);
await inspect(320, 844, true);

await browser.close();
