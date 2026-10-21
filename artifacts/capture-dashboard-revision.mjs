import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { ADMIN_PATH, mockAdmin, mockDashboard } from "../scripts/ui-mocks.mjs";

const BASE = "http://127.0.0.1:5173";
const OUT = "artifacts/ui/revision/dashboard-topbar";
await fs.promises.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ["--disable-gpu", "--font-render-hinting=none"],
});

function topbarInspection() {
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
  const language = header.querySelector(
    'button[aria-label^="Ganti bahasa"], button[aria-label^="Switch language"]',
  );
  const invitation = header.querySelector('a[aria-label="Lihat Undangan"]');
  return {
    header: rectOf(header),
    logo: rectOf(header.querySelector('img[src="/logo.png"]')),
    hamburger: rectOf(header.querySelector('button[aria-label="Menu"]')),
    invitation: rectOf(invitation),
    language: rectOf(language),
    languageLabel: language?.getAttribute("aria-label") ?? null,
    languageLang: language?.getAttribute("lang") ?? null,
    languageCode: language?.textContent?.trim() ?? null,
    headerText: header.textContent.replace(/\s+/g, " ").trim(),
    pageOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    hasSwitchGroup: Boolean(header.querySelector('[role="group"]')),
  };
}

async function inspect(kind, width, height, capture) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: "id-ID",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const isAdmin = kind === "admin";
  await (isAdmin ? mockAdmin(page) : mockDashboard(page));
  await page.goto(
    `${BASE}${isAdmin ? ADMIN_PATH : "/dashboard/demo-order-123"}?tab=orders`,
    { waitUntil: "domcontentloaded", timeout: 45000 },
  );
  if (!isAdmin) {
    await page.goto(`${BASE}/dashboard/demo-order-123?tab=share`, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
  }
  await page.waitForTimeout(2600);

  const main = await page.evaluate(topbarInspection);
  const sidebar = await page.evaluate(() => {
    const aside = document.querySelector("aside");
    return {
      text: aside?.textContent.replace(/\s+/g, " ").trim() ?? "",
      hasSlugLink: Boolean(aside?.querySelector('a[href*="/wedding/"]')),
      hasLanguage: Boolean(
        aside?.querySelector(
          'button[aria-label^="Ganti bahasa"], button[aria-label^="Switch language"]',
        ),
      ),
    };
  });

  if (capture) {
    await page.screenshot({ path: path.join(OUT, `${kind}-${width}.png`) });
  }

  if (width < 1024) {
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.waitForTimeout(450);
    const drawer = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      return {
        text: aside?.textContent.replace(/\s+/g, " ").trim() ?? "",
        hasSlugLink: Boolean(aside?.querySelector('a[href*="/wedding/"]')),
        hasLanguage: Boolean(
          aside?.querySelector(
            'button[aria-label^="Ganti bahasa"], button[aria-label^="Switch language"]',
          ),
        ),
        hasLogout: /keluar|logout/i.test(aside?.textContent ?? ""),
      };
    });
    if (capture) {
      await page.screenshot({ path: path.join(OUT, `${kind}-${width}-drawer.png`) });
    }
    console.log(`DRAWER ${kind} ${width}`, JSON.stringify(drawer));
  }

  console.log(`MAIN ${kind} ${width}`, JSON.stringify({ ...main, sidebar }));

  if (capture && isAdmin && width === 1440) {
    const desktopSwitch = await page.evaluate(() => {
      const header = [...document.querySelectorAll("header")].find(
        (element) => getComputedStyle(element).display !== "none",
      );
      return {
        hasSwitchGroup: Boolean(header?.querySelector('[role="group"]')),
        text: header?.textContent.replace(/\s+/g, " ").trim() ?? "",
      };
    });
    console.log("ADMIN DESKTOP", JSON.stringify(desktopSwitch));
  }

  await context.close();
}

await inspect("customer", 1440, 900, true);
await inspect("customer", 390, 844, true);
await inspect("customer", 360, 844, false);
await inspect("customer", 320, 844, false);
await inspect("admin", 1440, 900, false);
await inspect("admin", 390, 844, true);
await inspect("admin", 360, 844, false);
await inspect("admin", 320, 844, false);

await browser.close();
