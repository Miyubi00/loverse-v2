import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";

const ORDER = {
  id: "demo-order-123",
  slug: "dimas-sarah",
  groom_name: "Dimas",
  bride_name: "Sarah",
  wedding_date: "2026-11-22",
  template_slug: "motion-flow",
  payment_status: "success",
  event_details: {
    venue_name: "The Grand Ballroom",
    venue_address: "Jl. Jenderal Sudirman No. 1, Jakarta Pusat",
    banks: [],
    gallery: [],
  },
};

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

const TOKEN = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
  order_id: ORDER.id,
  exp: Math.floor(Date.now() / 1000) + 86_400,
})}.sig`;

test.beforeEach(async ({ context }) => {
  await context.addInitScript(
    ({ token, orderId }) => {
      sessionStorage.setItem("loverse_customer_token", token);
      sessionStorage.setItem("active_order_id", orderId);
    },
    { token: TOKEN, orderId: ORDER.id },
  );

  await context.route("**/rest/v1/orders**", (route) => {
    if (route.request().method() !== "GET") {
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/vnd.pgrst.object+json",
      body: JSON.stringify(ORDER),
    });
  });

  await context.route("**/rest/v1/rsvps**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "content-range": "0-0/0" },
      body: JSON.stringify([]),
    }),
  );

  await context.route("**/functions/v1/rsvp-list**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rsvps: [] }),
    }),
  );

  await context.route("**/rest/v1/public_invitations**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/vnd.pgrst.object+json",
      body: JSON.stringify({ ...ORDER, pin_code: null, email: null }),
    }),
  );
});

for (const width of [1440, 390]) {
  test(`language toggle swaps and persists at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/dashboard/${ORDER.id}?tab=share`);

    const toEnglish = page.getByRole("button", { name: "Ganti bahasa ke English" });
    await expect(toEnglish).toBeVisible();
    await expect(toEnglish).toHaveAttribute("lang", "id");
    await expect(toEnglish).toContainText("EN");
    await expect(page.getByRole("heading", { name: "Sebar Undangan" })).toBeVisible();

    await toEnglish.click();

    const toIndonesian = page.getByRole("button", {
      name: "Switch language to Bahasa Indonesia",
    });
    await expect(toIndonesian).toBeVisible();
    await expect(toIndonesian).toHaveAttribute("lang", "en");
    await expect(toIndonesian).toContainText("ID");
    await expect(page.getByRole("heading", { name: "Share Invitation" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("app_language")))
      .toBe("en");

    await page.reload();

    const persistedToggle = page.getByRole("button", {
      name: "Switch language to Bahasa Indonesia",
    });
    await expect(persistedToggle).toBeVisible();
    await expect(page.getByRole("heading", { name: "Share Invitation" })).toBeVisible();

    await persistedToggle.click();

    await expect(
      page.getByRole("button", { name: "Ganti bahasa ke English" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sebar Undangan" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("lang", "id");
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("app_language")))
      .toBe("id");
  });

  test(`invitation button opens the public page in a new tab at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`/dashboard/${ORDER.id}?tab=share`);

    const link = page.locator('a[aria-label="Lihat Undangan"]:visible').first();
    await expect(link).toHaveAttribute("href", `/wedding/${ORDER.slug}`);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");

    const popupPromise = page.waitForEvent("popup");
    await link.click();
    const popup = await popupPromise;
    await popup.waitForURL(`**/wedding/${ORDER.slug}`);
    expect(new URL(popup.url()).pathname).toBe(`/wedding/${ORDER.slug}`);
    await popup.close();
  });
}
