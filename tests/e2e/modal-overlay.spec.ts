import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const PHOTO = (label: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#efe4d8"/><text x="320" y="250" text-anchor="middle" font-family="sans-serif" font-size="32" fill="#5b4638">${label}</text></svg>`,
  )}`;

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nQAAAABJRU5ErkJggg==",
  "base64",
);

const ORDER = {
  id: "modal-order-123",
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
    gallery: [PHOTO("Gallery")],
    groom_photo: PHOTO("Groom"),
    bride_photo: PHOTO("Bride"),
    cover_photo: PHOTO("Cover"),
  },
};

const RSVP = {
  id: "rsvp-1",
  order_id: ORDER.id,
  session_id: "session-1",
  guest_name: "Budi Santoso",
  status: "hadir",
  pax: 2,
  message: "Selamat menempuh hidup baru!",
  reply: null,
  created_at: "2026-10-01T10:00:00.000Z",
};

const NOTICE = {
  id: "notice-modal-1",
  type: "warning",
  mode: "modal",
  title: "Pemberitahuan Uji",
  body: "Modal notice harus menutup seluruh viewport.",
  cta_label: "Mengerti",
  cta_href: null,
  starts_at: "2026-01-01T00:00:00.000Z",
  ends_at: null,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function jwt(payload: object) {
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    exp: Math.floor(Date.now() / 1000) + 86_400,
    ...payload,
  })}.sig`;
}

function countHeaders(count: number) {
  return {
    "content-range": `0-${Math.max(0, count - 1)}/${count}`,
    "access-control-expose-headers": "content-range",
  };
}

async function mockCustomer(context: BrowserContext, opts?: { rsvps?: boolean }) {
  const token = jwt({ order_id: ORDER.id });

  await context.addInitScript(
    ({ authToken, orderId }) => {
      sessionStorage.setItem("loverse_customer_token", authToken);
      sessionStorage.setItem("active_order_id", orderId);
    },
    { authToken: token, orderId: ORDER.id },
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

  await context.route("**/rest/v1/rsvps**", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headOnly = request.method() === "HEAD" || url.searchParams.get("select") === "id";
    const rows = opts?.rsvps ? [RSVP] : [];
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: countHeaders(rows.length),
      body: JSON.stringify(headOnly ? [] : rows),
    });
  });

  await context.route("**/functions/v1/rsvp-list**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ rsvps: opts?.rsvps ? [RSVP] : [] }),
    }),
  );
}

function readEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  try {
    const env = readFileSync(new URL("../../.env", import.meta.url), "utf8");
    return env.match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim();
  } catch {
    return undefined;
  }
}

const SUPABASE_URL = readEnv("VITE_SUPABASE_URL");
const SUPABASE_REF = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split(".")[0] : "";
const ADMIN_PATH = readEnv("VITE_ADMIN_PATH") || "/admin";

async function mockAdmin(page: Page) {
  const token = jwt({
    sub: "admin-user",
    role: "authenticated",
    aud: "authenticated",
    email: "admin@loverse.com",
  });
  const user = {
    id: "admin-user",
    aud: "authenticated",
    role: "authenticated",
    email: "admin@loverse.com",
    email_confirmed_at: "2026-01-01T00:00:00.000Z",
    phone: "",
    confirmed_at: "2026-01-01T00:00:00.000Z",
    last_sign_in_at: "2026-10-01T00:00:00.000Z",
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: {},
    identities: [],
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-10-01T00:00:00.000Z",
  };
  const session = {
    access_token: token,
    token_type: "bearer",
    expires_in: 86_400,
    expires_at: Math.floor(Date.now() / 1000) + 86_400,
    refresh_token: "mock-refresh-token",
    user,
  };

  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: `sb-${SUPABASE_REF}-auth-token`, value: JSON.stringify(session) },
  );

  await page.route("**/auth/v1/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith("/user")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(user) });
    }
    if (url.pathname.endsWith("/token")) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(session) });
    }
    return route.fulfill({ status: 204, body: "" });
  });

  await page.route("**/rest/v1/**", (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const table = url.pathname.split("/").filter(Boolean).pop();
    const rowsByTable: Record<string, unknown[]> = {
      orders: [ORDER],
      pending_orders: [],
      templates: [],
      inbound_emails: [],
      site_notices: [],
      admin_audit_log: [],
    };
    const rows = rowsByTable[table ?? ""] ?? [];
    const headOnly = request.method() === "HEAD" || url.searchParams.get("select") === "id";

    if (request.method() !== "GET" && request.method() !== "HEAD") {
      return route.fulfill({ status: 204, body: "" });
    }

    const acceptsObject = (request.headers().accept || "").includes("pgrst.object");
    return route.fulfill({
      status: 200,
      contentType: acceptsObject ? "application/vnd.pgrst.object+json" : "application/json",
      headers: countHeaders(rows.length),
      body: JSON.stringify(headOnly ? [] : acceptsObject ? (rows[0] ?? null) : rows),
    });
  });
}

async function expectFullViewport(page: Page) {
  const overlay = page.locator("[data-modal-root]");
  await expect(overlay).toHaveCount(1);
  await expect(overlay).toBeVisible();

  const box = await overlay.boundingBox();
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  expect(box).not.toBeNull();
  expect(Math.abs(box!.x)).toBeLessThan(1);
  expect(Math.abs(box!.y)).toBeLessThan(1);
  expect(Math.abs(box!.width - viewport.width)).toBeLessThan(1);
  expect(Math.abs(box!.height - viewport.height)).toBeLessThan(1);

  const state = await page.evaluate(() => {
    const root = document.querySelector("[data-modal-root]");
    const points = [
      [4, 4],
      [window.innerWidth - 4, 4],
      [4, window.innerHeight - 4],
      [window.innerWidth - 4, window.innerHeight - 4],
    ];
    return {
      bodyOverflow: document.body.style.overflow,
      zIndex: root ? getComputedStyle(root).zIndex : "",
      coversChrome: points.every(([x, y]) =>
        Boolean(document.elementFromPoint(x, y)?.closest("[data-modal-root]")),
      ),
      ariaModal: root?.querySelector('[role="dialog"]')?.getAttribute("aria-modal"),
    };
  });

  expect(state.bodyOverflow).toBe("hidden");
  expect(Number(state.zIndex)).toBeGreaterThan(50);
  expect(state.coversChrome).toBe(true);
  expect(state.ariaModal).toBe("true");
  await expect
    .poll(() => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))))
    .toBe(true);
}

async function expectBodyUnlocked(page: Page) {
  await expect
    .poll(() => page.evaluate(() => document.body.style.overflow))
    .not.toBe("hidden");
}

async function openMediaTab(page: Page) {
  await page.goto(`/dashboard/${ORDER.id}?tab=edit`);
  await page.getByRole("button", { name: /Foto & Galeri/ }).click();
  await expect(page.getByText("Foto Mempelai & Sampul")).toBeVisible();
}

for (const width of [1440, 390]) {
  const height = width === 390 ? 844 : 900;

  test(`dashboard confirm and lightbox stay full viewport after scroll and tab switch at ${width}px`, async ({
    page,
    context,
  }) => {
    await page.setViewportSize({ width, height });
    await mockCustomer(context);
    await openMediaTab(page);

    await page.getByRole("button", { name: /Musik & Rekening/ }).click();
    await page.getByRole("button", { name: /Foto & Galeri/ }).click();
    await page.waitForTimeout(400);
    expect
      .soft(
        await page
          .locator(".animate-msg-in")
          .first()
          .evaluate((element) => getComputedStyle(element).transform),
      )
      .toBe("none");

    await page.locator("main").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });

    const trigger = page.getByRole("button", { name: "Hapus", exact: true }).first();
    await trigger.evaluate((element) => {
      element.focus({ preventScroll: true });
      element.click();
    });
    const dialog = page.getByRole("dialog", { name: "Konfirmasi Hapus" });
    await expect(dialog).toBeVisible();
    await expectFullViewport(page);

    for (let index = 0; index < 4; index += 1) {
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]'))),
      ).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Batal" }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    await expectBodyUnlocked(page);

    const viewTrigger = page.getByRole("button", { name: "Lihat", exact: true }).first();
    await viewTrigger.evaluate((element) => element.click());
    const lightbox = page.getByRole("dialog", { name: "Foto Sampul (Cover Banner)" });
    await expect(lightbox).toBeVisible();
    await expectFullViewport(page);

    await page.keyboard.press("Escape");
    await expect(lightbox).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(lightbox).toBeHidden();
    await expectBodyUnlocked(page);
  });

  test(`image crop modal stays full viewport at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height });
    await mockCustomer(context);
    await openMediaTab(page);

    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Ganti Foto", exact: true }).first().click();
    const chooser = await chooserPromise;
    await chooser.setFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG });

    const dialog = page.getByRole("dialog", { name: "Atur Foto Mempelai Pria" });
    await expect(dialog).toBeVisible();
    await expectFullViewport(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(dialog).toBeVisible();

    const cancel = dialog.getByRole("button", { name: "Batal" });
    await expect(cancel).toBeEnabled({ timeout: 10_000 });
    await cancel.click();
    await expect(dialog).toBeHidden();
    await expectBodyUnlocked(page);
  });

  test(`RSVP reply modal stays full viewport at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height });
    await mockCustomer(context, { rsvps: true });
    await page.goto(`/dashboard/${ORDER.id}?tab=rsvp`);

    await page.getByRole("button", { name: "Balas" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Balas Ucapan" });
    await expect(dialog).toBeVisible();
    await expectFullViewport(page);
    await expect(dialog.locator("#rsvp-reply-text")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(dialog).toBeHidden();
    await expectBodyUnlocked(page);
  });

  test(`admin confirmation stays full viewport at ${width}px`, async ({ page }) => {
    test.skip(!SUPABASE_REF, "VITE_SUPABASE_URL tidak tersedia untuk mock sesi admin");
    await page.setViewportSize({ width, height });
    await mockAdmin(page);
    await page.goto(ADMIN_PATH);

    if (width === 390) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
    }
    await page.getByRole("button", { name: "Keluar" }).click();

    const dialog = page.getByRole("dialog", { name: "Konfirmasi Keluar" });
    await expect(dialog).toBeVisible();
    await expectFullViewport(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();
    await page.mouse.click(8, 8);
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Batal" }).click();
    await expect(dialog).toBeHidden();
    await expectBodyUnlocked(page);
  });

  test(`site notice modal stays full viewport at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height });
    await context.route("**/rest/v1/site_notices**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([NOTICE]),
      }),
    );

    await page.goto("/");
    const dialog = page.getByRole("dialog", { name: NOTICE.title });
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await expectFullViewport(page);

    await page.waitForTimeout(650);
    const transform = await page
      .locator(".page-enter")
      .first()
      .evaluate((element) => getComputedStyle(element).transform);
    expect(transform).toBe("none");

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expectBodyUnlocked(page);
  });

  test(`tutorial video modal stays full viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto("/tutorial");

    await page.getByRole("button", { name: /Putar video/ }).first().click();
    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible();
    await expectFullViewport(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expectBodyUnlocked(page);
  });
}
