import { expect, test } from "@playwright/test";

test("theme carousel advances with its DOM controls", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const showcase = page.getByRole("region", { name: "Pratinjau tema undangan" });
  await expect(showcase).toBeVisible();
  await expect(showcase).toHaveAttribute("data-showcase-index", "0");

  await page.getByRole("button", { name: "Tampilkan tema berikutnya" }).click();
  await expect(showcase).toHaveAttribute("data-showcase-index", "1");

  await page.getByRole("button", { name: "Tampilkan tema sebelumnya" }).click();
  await expect(showcase).toHaveAttribute("data-showcase-index", "0");
});

test("reduced motion uses the CSS 3D fallback without auto rotation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const showcase = page.getByRole("region", { name: "Pratinjau tema undangan" });
  await expect(showcase).toHaveAttribute("data-showcase-mode", "fallback");
  const fallback = page.locator("[data-showcase-fallback]");
  await expect(fallback).toBeVisible();
  await expect(page.getByRole("button", { name: /gerakan dikurangi/ })).toBeDisabled();

  const phoneCard = fallback.locator(":scope > div").nth(1);
  await expect(phoneCard).toHaveAttribute("style", /rotateY\(/);
  await expect(phoneCard).toHaveCSS("transition-property", "none");

  const originalBox = await showcase.boundingBox();
  await page.waitForTimeout(6500);
  await expect(showcase).toHaveAttribute("data-showcase-index", "0");

  await page.getByRole("button", { name: "Tampilkan tema berikutnya" }).click();
  await expect(showcase).toHaveAttribute("data-showcase-index", "1");
  const nextBox = await showcase.boundingBox();
  expect(nextBox?.height).toBe(originalBox?.height);
});

test("Save-Data and weak-device signals keep the fixed-size fallback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "deviceMemory", { configurable: true, value: 1 });
    Object.defineProperty(navigator, "hardwareConcurrency", { configurable: true, value: 2 });
    const connection = new EventTarget() as EventTarget & {
      saveData: boolean;
      effectiveType: string;
    };
    connection.saveData = true;
    connection.effectiveType = "2g";
    Object.defineProperty(navigator, "connection", { configurable: true, value: connection });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const showcase = page.getByRole("region", { name: "Pratinjau tema undangan" });
  await expect(showcase).toHaveAttribute("data-showcase-mode", "fallback");
  await expect(page.locator("[data-showcase-fallback]")).toBeVisible();
  const originalBox = await showcase.boundingBox();

  await page.getByRole("button", { name: "Tampilkan tema berikutnya" }).click();
  await expect(showcase).toHaveAttribute("data-showcase-index", "1");
  const nextBox = await showcase.boundingBox();
  expect(nextBox?.height).toBe(originalBox?.height);
});

test("unavailable WebGL keeps the CSS showcase interactive", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (contextId, ...args) {
      if (contextId === "webgl" || contextId === "webgl2") return null;
      return getContext.call(this, contextId, ...args);
    } as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const showcase = page.getByRole("region", { name: "Pratinjau tema undangan" });
  await expect(showcase).toHaveAttribute("data-showcase-mode", "fallback");
  await expect(page.locator("[data-showcase-fallback]")).toBeVisible();

  await page.getByRole("button", { name: "Tampilkan tema berikutnya" }).click();
  await expect(showcase).toHaveAttribute("data-showcase-index", "1");
});
