# UI and Accessibility Audit

Date: 2026-10-21  
Build: `ui-redesign` worktree, Vite production build passing  
Automated tools: axe-core via `@axe-core/playwright` and the custom typography audit

## 1. Method

- `scripts/audit-a11y.mjs` launches Chromium (`--disable-gpu`), opens each route at 1440×900, waits for hydration/content, and runs axe with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, and `best-practice`.
- `scripts/audit-typography.mjs` uses `scripts/ui-mocks.mjs` for authenticated customer/admin routes, opens 25 app routes at 390×844 and 1440×900, measures rendered text, and runs axe `color-contrast` at desktop.
- Console errors are captured but are not treated as accessibility violations.
- Visual review used `scripts/capture-ui.mjs` and `scripts/capture-typography.mjs` at desktop and mobile widths; interaction states were captured separately (demo overlay, tutorial modal, order steps, payment variants, AI chat empty state).
- Quality gates: `npm run lint`, `npm run typecheck`, `npm test` (44/44), `npm run build`.

Run them with the dev server active:

```powershell
node scripts/audit-a11y.mjs
node scripts/audit-typography.mjs
```

Reports: `artifacts/ui/after/a11y-report.json` and `artifacts/ui/revision/typography/typography-report.json`.

## 2. Final Result

### 2.1 Full Axe Audit

| Route | Violations |
| --- | --- |
| `/` | 0 |
| `/order` | 0 |
| `/login` | 0 |
| `/payment-status` | 0 |
| `/tutorial` | 0 |
| `/demo/motion-flow` | 0 |
| admin login (`/panel-daffa11`) | 0 |

**All seven full-axe routes are clean** for the configured rule set.

### 2.2 Typography and Color Contrast

`node scripts/audit-typography.mjs` audited 25 routes at mobile and desktop widths, including authenticated customer tabs and every admin tab through `scripts/ui-mocks.mjs`.

| Check | Result |
| --- | --- |
| Minimum sizes (body, functional, table/control, display/eyebrow) | 0 violations |
| Uppercase tracking / sentence-case labels | 0 violations |
| Body line-height and measure | 0 violations |
| Color contrast (axe, desktop) | 0 violations |
| Mono ratio | 0.0% on every route |
| Horizontal document overflow | None; only intentional marquee/off-canvas elements |

The route set covers home, portfolio, contact, tutorial, privacy, terms, order, order success, login, forgot-PIN, reset confirmation, payment status, demo, 404, dashboard share/edit/RSVP, admin login/orders/WhatsApp/templates/notices/inbox/audit, and the wedding demo. `.theme-canvas` is excluded from app-typography and contrast checks.

## 3. Issues Found and Fixed

| Area | Issue | Fix |
| --- | --- | --- |
| Tokens | `ink-400` (`#9B8575`) failed 4.5:1 on cream for small text | Changed to `#7F6A5C`; documented as minimum muted text |
| Order form | Inputs lacked ids/labels | Added `order-groom-name`, `order-bride-name`, `order-wedding-date`, `order-email`, `order-whatsapp` with `htmlFor` |
| Login | Nested `<main>` inside `AuthShell` duplicated landmarks | Nested element changed to `<div>` |
| Catalog | Cover link `aria-label` conflicted with visible text | Removed mismatched label; visible text is the name |
| Tutorial | Video play button had mismatched `aria-label`; duration read awkwardly | Removed `aria-label`, added `sr-only` title/duration, hid duplicate duration from AT |
| Home hero | Low-opacity cream labels on ink failed contrast | Raised to `/55`–`/60` |
| Home peach card | `ink-800/45`, `ink-800/65`, `ink-700/65` copy failed contrast | Full `ink-800`/`ink-700` where readable; decorative text reduced |
| Payment status | Raw green hex values and success text failed contrast | Moved to `success-600`/`success-700`; WhatsApp CTA `bg-success-700 hover:bg-success-600 text-cream-50` |
| Order/payment/dashboard copy | `text-ink-300` used for readable muted text | Replaced with `text-ink-400` in OrderPage, OrderSuccessPage, PaymentStatusPage, OrderSummary, OrderSteps, PaymentMethodPicker, LegalPage, Pagination, ShareTab, OrdersTab |
| Order steps | `ember-500` active step text below 4.5:1 | Active step uses `ember-600` |
| Demo overlay | Overlay nav had no landmark/name | Wrapped as `<nav aria-label="Demo">` |
| Demo theme | RSVP pax `<select>` had no accessible name | Added `aria-label="Jumlah hadir"` in `MotionFlowTheme` |
| Demo theme | Cover content sat outside a landmark (`region` rule) | Cover envelope is now `role="region" aria-label="Undangan"` |
| Typography | 8–13px labels, table text, inputs, and microcopy throughout app UI | Raised to at least 14px (`.eyebrow` 13px); body copy is 16px mobile / 15px desktop; inputs 15px; tables 14px |
| Typography | Uppercase labels/buttons/table headers and tracking up to `0.22em` | Sentence case for labels/buttons/tables; positive tracking normalized to `0.06em`; uppercase kickers capped at `0.08em` |
| Typography | `.font-data` used JetBrains Mono for ordinary labels | `.font-data` is now Instrument Sans with tabular figures; mono is optional and limited to technical data |
| Dashboard | Low-contrast `ink-400/60–/70` in ShareTab | Full `ink-400` |
| Order success | Step numbers `ember-500/65` failed contrast | `ember-600` |
| 404 | Footer `cream-100/25` failed contrast | `cream-100/75` |
| Admin/customer nav | Low-opacity cream/peach labels on ink sidebars | Raised to `/65`–`/85` |
| Contact | AI card overflowed its grid column on mobile | Section/card `min-w-0`; chat area widened, empty state compacted into a 2-column grid, and empty-state scroll reset to top |
| Home | FAQ answer used a `<div>` outside body-copy rules | Changed to `<p>` |

## 4. Visual Verification

Screenshots in `artifacts/ui/after/` and `artifacts/ui/revision/typography/screens/` cover home, order flow, payment status, auth, dashboard, admin login/tabs, demo, legal, tutorial, portfolio, contact, AI chat, and 404 at desktop/mobile widths.

Known screenshot caveat: Chromium/SwiftShader can corrupt glyph rendering (repeated or ghosted text) and large full-page captures are unreliable when displayed at once. Repeated-text home, dashboard, and admin captures were confirmed to be display artifacts: targeted crops were clean and the DOM contained one copy of each string. Interaction captures should use:

```text
--disable-gpu --font-render-hinting=none
```

DOM text assertions and targeted crops were used to confirm content in those cases.

## 5. Residual Risks / Not Audited

- **Authenticated dashboard and admin content** are covered by the typography/contrast audit through `scripts/ui-mocks.mjs`, but they are not yet in the full axe rule-set route list. Login surfaces are audited; dashboard/admin visuals were captured and spot-checked via targeted crops.
- **Lighthouse** has not been run. Build output is green; the standard warning is the lazy `PhoneShowcaseScene` chunk at 938.88 kB (253.95 kB gzip), within the 300 kB gzip target for the Three.js showcase.
- **Console noise** on some pages is pre-existing and unrelated to the redesign: Midtrans Snap CSP warning, Supabase `public_invitations` 400, Turnstile 400/troubleshoot widget on admin login.
- **Invitation themes** retain their original visual system. Only the two `MotionFlowTheme` accessibility attributes above were changed; other themes may have analogous select/landmark issues when opened directly.
- **Dev-only invoice/email preview pages** are not in the typography audit route list; they were codemodded but not visually audited.
- **Home mobile first fold** still places most of the `PhoneShowcase` below the fold at 390×844; this is a composition limitation, not an overflow failure.
- **Mono ratio is 0.0%**: `.font-data` now uses tabular Instrument Sans. JetBrains Mono remains available for technical data but is not currently required.
- Full keyboard-only walkthrough of every modal was sampled, not exhaustively automated.

## 6. Follow-up

1. Extend the full axe route list to authenticated dashboard/admin tabs using `scripts/ui-mocks.mjs`.
2. Add `/dev/invoice` and `/dev/email` to the typography audit if those pages remain in scope.
3. Run Lighthouse against `vite preview` if performance scoring is required; ignore simulated throttling differences from CI.
4. If theme accessibility becomes in scope, audit all 40 RSVP selects and cover landmarks across `src/templates/themes/`.

## 7. Modal Full-Viewport Diagnosis (Revisi A-D)

- Modal lama dirender di dalam wrapper beranimasi. `.animate-msg-in` (customer/admin tab content) dan `.page-enter` (PublicLayout) memakai `animation-fill-mode: both`; setelah animasi selesai, `transform: translateY(0)` tetap tersimpan dan menjadi containing block untuk `position: fixed`. Akibatnya overlay modal terpotong ke area konten, bukan viewport.
- Perbaikan: kedua animasi memakai `fill-mode: backwards` agar transform kembali `none` setelah selesai, dan seluruh modal memakai shared `Modal` yang di-portal ke `document.body`.
- Shared Modal menangani scroll lock, focus trap/restore, Escape/backdrop sesuai perilaku lama, `role="dialog"`, `aria-modal="true"`, label, serta lapisan `z-[200]` di atas topbar/sidebar/drawer.
- Dimigrasikan: legacy ConfirmDialog, ui ConfirmDialog, ImageCropModal, LightboxPreview, RsvpReplyModal, SiteNoticeView, dan video modal TutorialPage. `EditOrderModal` memakai modal-modal tersebut untuk konfirmasi/crop/lightbox di dalamnya.

## 8. Contact Scrollbar and AI Card Revision (2026-10-22)

### 8.1 Root Cause

- `html` is the intended viewport scroller (`overflow-x: hidden; overflow-y: auto`). `body` and `#root` remain `visible`.
- `main#main-content` used `overflow-x-hidden`. Because one axis was not `visible`, the browser computed `overflow-y: auto`, turning `main` into a second scroll container.
- That inner container measured 10px of overflow during `.page-enter` (`translateY(10px)`) and about 20px after settling because `Reveal` applies `translate-y-5` to offscreen quick links. The result was a short, unnecessary second scrollbar inside `main`.
- `scrollbar-gutter: stable` was considered but not applied: the inner container, not scrollbar width, caused the duplication.

### 8.2 Fix

- `src/layouts/PublicLayout.tsx`: `overflow-x-hidden` changed to `overflow-x-clip` on `main#main-content`. This clips horizontal decoration without creating a vertical scroll container or changing layout.
- `src/components/contact/AiAssistant.tsx`: card rebuilt with 4px corners, flat header, logo avatar, list-style quick questions, editorial message treatment, 44px send control, 320–460px message area, and container-only auto-scroll.
- Auto-scroll still calls `scrollTo` on `.chat-scroll` only; it does not call `scrollIntoView`. Smooth behavior is skipped under `prefers-reduced-motion`.
- `src/pages/ContactPage.tsx`: AI and WhatsApp cards now share a two-column stretched grid with equal 593px height at 1440px; quick-link cards use the same 4px border treatment.

### 8.3 Verification

- DOM metrics at 1440×900 and 390×844: only `html` is a page scroll container; `main` computes `overflow: visible`; document horizontal overflow is `false`.
- AI and WhatsApp card rectangles: both `top: 514`, `bottom: 1107`, `height: 593` at 1440×900.
- Chat empty state: `clientHeight 320`, `scrollHeight 320`, `scrollTop 0` (no initial inner scrollbar).
- Chat with a long mocked reply: `clientHeight 460`, `scrollHeight 713`, `scrollTop 253`; only the message area scrolls.
- Captures at 1440×900 and 390×844 in Indonesian and English: `%TEMP%\opencode\contact-final\` (viewport, full page, edge crop, hover, focus, mocked chat, long-reply overflow).
- Home, portfolio, and tutorial were spot-checked at both widths: `main` overflow-y `visible`, no horizontal overflow.
- `impeccable detect --scope layout` on the three changed files returned `[]`. URL scan only reports the intentional Instrument Sans/cream brand system as advisory slop warnings.
- `npm run typecheck`, `npm run lint`, and `npm run build` pass. Tests were intentionally not run for this revision.

### 8.4 Residual Notes

- Headless Chromium uses an overlay scrollbar and full-page captures can crop the rightmost 10px. The visible viewport screenshot and DOM metrics were used as the scrollbar proof; the bar is present and singular.
- The WhatsApp card has purposeful vertical breathing room at 1440px because it stretches to match the taller AI chat card.
