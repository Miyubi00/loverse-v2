import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

function envValue(key: string, fallback: string) {
  try {
    const line = readFileSync(".env", "utf8")
      .split(/\r?\n/)
      .find((entry) => entry.startsWith(`${key}=`));
    return line?.slice(key.length + 1).trim() || fallback;
  } catch {
    return fallback;
  }
}

const ADMIN_PATH = envValue("VITE_ADMIN_PATH", "/admin");
const PUBLIC_ROUTES = [
  "/",
  "/order",
  "/login",
  "/forgot-pin",
  "/payment-status",
  "/contact",
  "/portfolio",
  "/tutorial",
  "/privacy",
  "/terms",
  "/halaman-tidak-ditemukan",
];
const TO_ENGLISH = "Ganti bahasa ke English";
const TO_INDONESIAN = "Switch language to Bahasa Indonesia";

for (const width of [1440, 390]) {
  test(`one language toggle is available across public and admin routes at ${width}px`, async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      if (width < 1024) {
        await page.getByRole("button", { name: "Menu", exact: true }).click();
      }

      await expect(page.getByRole("button", { name: TO_ENGLISH })).toBeVisible();
      await expect(page.getByRole("group", { name: /Pilih Bahasa/ })).toHaveCount(0);

      if (width < 1024) {
        await page.getByRole("button", { name: "Tutup menu", exact: true }).click();
      }
    }

    await page.goto("/demo/motion-flow", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: TO_ENGLISH }).click();
    await expect(page.getByRole("button", { name: TO_INDONESIAN })).toBeVisible();
    await page.getByRole("button", { name: TO_INDONESIAN }).click();
    await expect(page.getByRole("button", { name: TO_ENGLISH })).toBeVisible();

    await page.goto(ADMIN_PATH, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: TO_ENGLISH })).toBeVisible();
  });
}

test("public toggle swaps language and persists after reload", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/portfolio");

  await page.getByRole("button", { name: TO_ENGLISH }).click();

  await expect(page.getByRole("button", { name: TO_INDONESIAN })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem("app_language")))
    .toBe("en");

  await page.reload();

  await expect(page.getByRole("button", { name: TO_INDONESIAN })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");

  await page.getByRole("button", { name: TO_INDONESIAN }).click();
  await expect(page.getByRole("button", { name: TO_ENGLISH })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
});
