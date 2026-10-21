import { Buffer } from "node:buffer";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const SVG_PHOTO = (label: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="#efe4d8"/><text x="160" y="170" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#5b4638">${label}</text></svg>`,
  )}`;

const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nQAAAABJRU5ErkJggg==",
  "base64",
);

function order(id: string, photos: boolean) {
  return {
    id,
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
      gallery: photos ? [SVG_PHOTO("Gallery 1")] : [],
      ...(photos
        ? {
            groom_photo: SVG_PHOTO("Groom"),
            bride_photo: SVG_PHOTO("Bride"),
            cover_photo: SVG_PHOTO("Cover"),
          }
        : {}),
    },
  };
}

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

async function mockDashboard(context: BrowserContext, data: ReturnType<typeof order>) {
  const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    order_id: data.id,
    exp: Math.floor(Date.now() / 1000) + 86_400,
  })}.sig`;

  await context.addInitScript(
    ({ authToken, orderId }) => {
      sessionStorage.setItem("loverse_customer_token", authToken);
      sessionStorage.setItem("active_order_id", orderId);
    },
    { authToken: token, orderId: data.id },
  );

  await context.route("**/rest/v1/orders**", (route) => {
    if (route.request().method() !== "GET") {
      return route.fulfill({ status: 204, body: "" });
    }
    return route.fulfill({
      status: 200,
      contentType: "application/vnd.pgrst.object+json",
      body: JSON.stringify(data),
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
}

async function openMediaTab(page: Page, id: string) {
  await page.goto(`/dashboard/${id}?tab=edit`);
  await page.getByRole("button", { name: /Foto & Galeri/ }).click();
  await expect(page.getByText("Foto Mempelai & Sampul")).toBeVisible();
}

async function expectFilePicker(page: Page, trigger: ReturnType<Page["getByRole"]>, title: string) {
  const chooserPromise = page.waitForEvent("filechooser");
  await trigger.click();
  const chooser = await chooserPromise;
  await chooser.setFiles({ name: "photo.png", mimeType: "image/png", buffer: PNG });
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.reload();
}

for (const width of [1440, 390]) {
  test(`photo tiles and cover use the full clickable area at ${width}px`, async ({
    page,
    context,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const data = order(`empty-${width}`, false);
    await mockDashboard(context, data);

    await openMediaTab(page, data.id);

    await expect(page.getByText("Upload Foto", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Ganti Foto", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Upload Banner Sampul", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Ganti Banner Sampul", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Upload Foto ke Galeri", { exact: true })).toHaveCount(1);

    const uploads = page.getByRole("button", { name: "Upload Foto", exact: true });
    await expect(uploads).toHaveCount(3);

    for (const [index, title] of [
      "Atur Foto Mempelai Pria",
      "Atur Foto Mempelai Wanita",
      "Atur Banner Cover",
    ].entries()) {
      if (index > 0) await openMediaTab(page, data.id);
      await expectFilePicker(page, uploads.nth(index), title);
    }
  });

  test(`filled photo tiles, cover, view and delete behave correctly at ${width}px`, async ({
    page,
    context,
  }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    const data = order(`filled-${width}`, true);
    await mockDashboard(context, data);
    await openMediaTab(page, data.id);

    let chooserCount = 0;
    page.on("filechooser", () => {
      chooserCount += 1;
    });

    const bannerView = page.getByRole("button", { name: "Lihat", exact: true }).first();
    const saveButton = page.getByRole("button", { name: "Simpan Perubahan" });
    const galleryUpload = page.getByRole("button", { name: "Upload Foto ke Galeri" });

    if (width === 390) {
      await expect(bannerView.locator("svg").first()).toBeHidden();
      await expect(saveButton.locator("svg").first()).toBeHidden();
      await expect(galleryUpload.locator("svg").first()).toBeHidden();
    } else {
      await expect(bannerView.locator("svg").first()).toBeVisible();
      await expect(saveButton.locator("svg").first()).toBeVisible();
      await expect(galleryUpload.locator("svg").first()).toBeVisible();
    }

    const changes = page.getByRole("button", { name: "Ganti Foto" });
    await expect(changes).toHaveCount(3);
    await expectFilePicker(page, changes.nth(0).locator("img"), "Atur Foto Mempelai Pria");

    await openMediaTab(page, data.id);
    await expectFilePicker(
      page,
      page.getByRole("button", { name: "Ganti Foto" }).nth(1).locator("img"),
      "Atur Foto Mempelai Wanita",
    );

    await openMediaTab(page, data.id);
    await expectFilePicker(
      page,
      page.getByRole("button", { name: "Ganti Foto" }).nth(2),
      "Atur Banner Cover",
    );

    await openMediaTab(page, data.id);
    chooserCount = 0;
    await page.getByRole("button", { name: "Lihat", exact: true }).first().click();
    await expect(page.getByRole("img", { name: "Foto Sampul (Cover Banner)" })).toBeVisible();
    expect(chooserCount).toBe(0);
    await page.mouse.click(8, 8);

    await page.getByRole("button", { name: "Hapus", exact: true }).first().click();
    await expect(page.getByText("Konfirmasi Hapus")).toBeVisible();
    expect(chooserCount).toBe(0);
    await page.getByRole("button", { name: "Batal" }).click();
  });
}

for (const width of [320, 360, 390]) {
  test(`edit content tabs stay readable without icons at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 740 });
    const data = order(`tabs-${width}`, false);
    await mockDashboard(context, data);
    await openMediaTab(page, data.id);

    const tabs = page.getByRole("button", {
      name: /Detail Acara & Lokasi|Foto & Galeri|Musik & Rekening/,
    });
    await expect(tabs).toHaveCount(3);

    const metrics = await tabs.evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        const label = element.querySelector("span");
        return {
          left: rect.left,
          right: rect.right,
          width: rect.width,
          height: rect.height,
          fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
          lineClamp: label ? getComputedStyle(label).webkitLineClamp : "",
          labelScrollWidth: label?.scrollWidth ?? 0,
          labelClientWidth: label?.clientWidth ?? 0,
        };
      }),
    );

    const widths = metrics.map((metric) => metric.width);
    expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(1);
    for (const metric of metrics) {
      expect(metric.height).toBeGreaterThanOrEqual(44);
      expect(metric.fontSize).toBeGreaterThanOrEqual(13);
      expect(metric.lineClamp).toBe("2");
      expect(metric.left).toBeGreaterThanOrEqual(0);
      expect(metric.right).toBeLessThanOrEqual(width);
      expect(metric.labelScrollWidth).toBeLessThanOrEqual(metric.labelClientWidth + 1);
    }

    for (let index = 0; index < 3; index += 1) {
      await expect(tabs.nth(index).locator("svg").first()).toBeHidden();
    }

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(horizontalOverflow).toBeLessThanOrEqual(0);
  });
}
