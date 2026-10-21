import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  ADMIN_PATH,
  MOCK_ORDER,
  MOCK_RSVPS,
  mockAdmin,
  mockDashboard,
} from "../scripts/ui-mocks.mjs";

const BASE = "http://127.0.0.1:5173";
const OUT_UPLOAD = "artifacts/ui/revision/upload-areas";
const OUT_MODAL = "artifacts/ui/revision/modal-viewport";
const OUT_LANGUAGE = "artifacts/ui/revision/language-toggle";

for (const dir of [OUT_UPLOAD, OUT_MODAL, OUT_LANGUAGE]) {
  await fs.promises.mkdir(dir, { recursive: true });
}

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nQAAAABJRU5ErkJggg==",
  "base64",
);

const EMPTY_ORDER = {
  ...MOCK_ORDER,
  event_details: {
    ...MOCK_ORDER.event_details,
    groom_photo: "",
    bride_photo: "",
    cover_photo: "",
    gallery: [],
    banks: [],
  },
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

const browser = await chromium.launch({
  args: ["--disable-gpu", "--font-render-hinting=none"],
});

async function withPage(width, height, run) {
  const context = await browser.newContext({
    viewport: { width, height },
    locale: "id-ID",
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await run(page);
  } finally {
    await context.close();
  }
}

async function shot(page, dir, name) {
  await page.screenshot({ path: path.join(dir, name) });
  console.log(`SHOT ${path.join(dir, name)}`);
}

async function mockEmptyOrder(page) {
  await mockDashboard(page);
  await page.route("**/rest/v1/orders**", (route) => {
    if (route.request().method() !== "GET") {
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/vnd.pgrst.object+json",
      body: JSON.stringify(EMPTY_ORDER),
    });
  });
}

async function openMediaTab(page) {
  await page.goto(`${BASE}/dashboard/${MOCK_ORDER.id}?tab=edit`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("button", { name: /Foto & Galeri/ }).click();
  await page.getByText("Foto Mempelai & Sampul").waitFor();
  await page.waitForTimeout(700);
}

for (const [width, height] of [
  [1440, 900],
  [390, 844],
]) {
  await withPage(width, height, async (page) => {
    await mockEmptyOrder(page);
    await openMediaTab(page);
    await shot(page, OUT_UPLOAD, `edit-empty-${width}x${height}.png`);
  });

  await withPage(width, height, async (page) => {
    await mockDashboard(page);
    await openMediaTab(page);
    await shot(page, OUT_UPLOAD, `edit-filled-${width}x${height}.png`);
  });
}

await withPage(360, 740, async (page) => {
  await mockDashboard(page);
  await page.goto(`${BASE}/dashboard/${MOCK_ORDER.id}?tab=edit`, {
    waitUntil: "domcontentloaded",
  });
  await page.getByRole("button", { name: /Foto & Galeri/ }).click();
  await page.getByText("Foto Mempelai & Sampul").waitFor();
  await page.waitForTimeout(700);
  await shot(page, OUT_UPLOAD, "edit-tabs-360x740.png");
});

for (const [width, height] of [
  [1440, 900],
  [390, 844],
]) {
  await withPage(width, height, async (page) => {
    await mockDashboard(page);
    await openMediaTab(page);

    await page.locator("main").evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await page.getByRole("button", { name: "Hapus", exact: true }).first().click();
    await page.getByRole("dialog", { name: "Konfirmasi Hapus" }).waitFor();
    await page.waitForTimeout(200);
    await shot(page, OUT_MODAL, `confirm-${width}x${height}.png`);
    await page.getByRole("dialog", { name: "Konfirmasi Hapus" }).getByRole("button", { name: "Batal" }).click();

    await page.getByRole("button", { name: "Lihat", exact: true }).first().click();
    await page.getByRole("dialog", { name: "Foto Sampul (Cover Banner)" }).waitFor();
    await page.waitForTimeout(200);
    await shot(page, OUT_MODAL, `lightbox-${width}x${height}.png`);
    await page.mouse.click(8, 8);
    await page.getByRole("dialog", { name: "Foto Sampul (Cover Banner)" }).waitFor({ state: "hidden" });

    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "Ganti Foto", exact: true }).first().click();
    const chooser = await chooserPromise;
    await chooser.setFiles(path.resolve("public/previews/motion-flow.webp"));
    const crop = page.getByRole("dialog", { name: "Atur Foto Mempelai Pria" });
    await crop.waitFor();
    await crop.getByRole("button", { name: "Batal" }).waitFor();
    await page.waitForTimeout(500);
    await shot(page, OUT_MODAL, `crop-${width}x${height}.png`);
    const cropCancel = crop.getByRole("button", { name: "Batal" });
    await cropCancel.waitFor();
    await cropCancel.click();
  });

  await withPage(width, height, async (page) => {
    await mockDashboard(page);
    await page.route("**/functions/v1/rsvp-list**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ rsvps: MOCK_RSVPS }),
      }),
    );
    await page.goto(`${BASE}/dashboard/${MOCK_ORDER.id}?tab=rsvp`, {
      waitUntil: "domcontentloaded",
    });
    await page.getByRole("button", { name: "Balas" }).first().click();
    await page.getByRole("dialog", { name: "Balas Ucapan" }).waitFor();
    await page.waitForTimeout(300);
    await shot(page, OUT_MODAL, `rsvp-reply-${width}x${height}.png`);
  });

  await withPage(width, height, async (page) => {
    await mockAdmin(page);
    await page.goto(`${BASE}${ADMIN_PATH}?tab=orders`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);
    if (width === 390) {
      await page.getByRole("button", { name: "Menu", exact: true }).click();
      await page.waitForTimeout(450);
    }
    await page.getByRole("button", { name: "Keluar" }).click();
    await page.getByRole("dialog", { name: "Konfirmasi Keluar" }).waitFor();
    await page.waitForTimeout(200);
    await shot(page, OUT_MODAL, `admin-confirm-${width}x${height}.png`);
  });

  await withPage(width, height, async (page) => {
    await page.route("**/rest/v1/site_notices**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([NOTICE]),
      }),
    );
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await page.getByRole("dialog", { name: NOTICE.title }).waitFor({ timeout: 20_000 });
    await page.waitForTimeout(650);
    await shot(page, OUT_MODAL, `notice-${width}x${height}.png`);
  });

  await withPage(width, height, async (page) => {
    await page.goto(`${BASE}/tutorial`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Putar video/ }).first().click();
    await page.getByRole("dialog").first().waitFor();
    await page.waitForTimeout(800);
    await shot(page, OUT_MODAL, `video-${width}x${height}.png`);
  });
}

await withPage(1440, 900, async (page) => {
  await page.goto(`${BASE}/portfolio`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  await shot(page, OUT_LANGUAGE, "public-navbar-1440x900.png");
});

await withPage(390, 844, async (page) => {
  await page.goto(`${BASE}/portfolio`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.waitForTimeout(450);
  await page.locator("#mobile-navigation").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await shot(page, OUT_LANGUAGE, "public-menu-390x844.png");
});

for (const [width, height] of [
  [1440, 900],
  [390, 844],
]) {
  await withPage(width, height, async (page) => {
    await page.goto(`${BASE}${ADMIN_PATH}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    await shot(page, OUT_LANGUAGE, `admin-login-${width}x${height}.png`);
  });

  await withPage(width, height, async (page) => {
    await mockDashboard(page);
    await page.goto(`${BASE}/dashboard/${MOCK_ORDER.id}?tab=share`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForTimeout(1600);
    await shot(page, OUT_LANGUAGE, `customer-dashboard-${width}x${height}.png`);
  });

  await withPage(width, height, async (page) => {
    await mockAdmin(page);
    await page.goto(`${BASE}${ADMIN_PATH}?tab=orders`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1800);
    await shot(page, OUT_LANGUAGE, `admin-panel-${width}x${height}.png`);
  });

  await withPage(width, height, async (page) => {
    await page.goto(`${BASE}/demo/motion-flow`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1400);
    await shot(page, OUT_LANGUAGE, `demo-${width}x${height}.png`);
  });
}

await browser.close();
