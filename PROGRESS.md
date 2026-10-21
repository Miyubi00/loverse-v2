# LoVerse UI Redesign — Progress

Status: **Revisions A–D committed; PhoneShowcase v2 M1–M4 complete. The full Playwright suite has two unrelated language-toggle failures on `/demo/motion-flow`.**

## PhoneShowcase v2 — M1

- [x] Replaced the previous `PhoneShowcaseScene` chunk with a static two-phone 3D composition: opposed V pose, local template previews on both screens, warm lighting, orbit rings, and warm vignette background.
- [x] Normalized the GLB at runtime from the screen normal and bounding box so the display faces +Z and the top faces +Y; model geometry is unchanged and normals are creased for smoother highlights.
- [x] Applied warm metal to the `Case`, black to the bezel, dark camera materials, and local invitation preview textures. The GLB has separate named meshes/materials for screen, case, bezel, selfie camera, rear camera, and camera border. Its single `Case` mesh combines the rear shell and side frame, so those surfaces share the warm metal finish.
- [x] Added Indonesian and English footer credit for “Low Poly Phone for Mockups” by akacodes, with modified-model attribution; details in `docs/credits.md`.
- [x] Captured WebGL screenshots at [1440×900](artifacts/ui/revision/phone-showcase-v2/desktop-1440x900.png) and [390×844](artifacts/ui/revision/phone-showcase-v2/mobile-390x844.png). Compared with `docs/ref-3d-target.png`, the warm palette, V composition, and orbit motif are present. The source low-poly phone has a round camera hole and simpler edge treatment than the target, so the model silhouette is not an exact match. Mobile capture is scrolled to the showcase because the home page's first fold places most of it below the fold.
- [x] Replaced the old 938.88 kB scene chunk: current scene chunk is 1,073,057 bytes / 296,593 bytes gzip; `public/models/phone.glb` is 42,988 bytes / 10,516 bytes gzip.
- [x] `npm run lint` and `npm run typecheck` pass for M1.

## PhoneShowcase v2 — M2

- [x] Added horizontal pointer drag with velocity-sensitive spin and snap; carousel advances themes by one step when released or controlled with previous/next buttons.
- [x] Added a 360° eased rotation. The rear-camera group is placed on the back side using the model bounds, hidden while the display faces the viewer, and shown as the phones turn around. The circle no longer overlays the template; the front pill remains.
- [x] Template textures swap at the halfway point, while the screens face away. Autoplay advances every 6.2 seconds and can be paused or resumed.
- [x] Added bilingual DOM controls, arrow-key navigation, a live announcement for the active theme, and touch-safe horizontal dragging.
- [x] Checked the flow in WebGL and captured desktop and 390×844 mobile views at [M2 desktop](artifacts/ui/revision/phone-showcase-v2/m2-desktop-carousel.png) and [M2 mobile](artifacts/ui/revision/phone-showcase-v2/m2-mobile-carousel.png).
- [x] `npm run lint` and `npm run typecheck` pass.

## PhoneShowcase v2 — M3

- [x] Kept the same reserved showcase stage dimensions while the absolute WebGL and CSS layers switch, so loading or losing the model does not change layout size.
- [x] CSS fallback now uses perspective, depth offsets, and Y rotation to render the theme cards as a 3D carousel.
- [x] Reduced-motion users stay on the fallback, get no CSS transition or automatic rotation, and retain immediate previous/next controls.
- [x] WebGL, device memory/core, and Save-Data checks choose the fallback; Save-Data preference changes are observed during the session. A failed or lost WebGL scene also exposes the fallback.
- [x] `npm run lint` and `npm run typecheck` pass.

## PhoneShowcase v2 — M4

- [x] Added four focused Playwright tests for previous/next controls, reduced motion and no autoplay, Save-Data/weak-device fallback, and unavailable WebGL. All 4 pass.
- [x] Full Playwright suite: 28 passed, 2 failed in the existing `language-toggle.spec.ts` while it visits `/demo/motion-flow`. At 1440px the page shows its generic error screen after switching back to Indonesian; at 390px the demo language toggle is missing. These failures are outside the showcase component.
- [x] `npm run lint`, `npm run typecheck`, and production build pass. `npm test` passes 44/44.
- [x] Lighthouse mobile audit on production preview: Performance 45, Accessibility 100, Best Practices 96, SEO 100; FCP 2.8s, LCP 8.1s, TBT 1,360ms, CLS 0.002, Speed Index 3.0s.
- [x] Production build sizes: `PhoneShowcaseScene` 1,075,210 bytes / 297,350 bytes gzip; `public/models/phone.glb` 42,988 bytes / 10,516 bytes gzip.

## Post-M4 follow-up — card transition

- [x] Replaced the full 360° phone turn and the initial shared-stack slide with a two-phone shuffle: the rear phone advances into the front position while the current front phone recedes behind it. They separate in depth as they pass, without spinning around the Y axis.
- [x] Each shuffle straightens both phones into an almost-overlapped stack, offset slightly so only the rear phone's bezel and side edge peek out; after they exchange places, the V pose returns.
- [x] The exchange now has a pronounced depth pass: the rear phone pushes through the front plane into the foreground as the current front phone recedes, then both settle into their new slots before the V rotations return.
- [x] The incoming phone carries the next template through the exchange. Horizontal drag remains, and the CSS fallback keeps its layered card stack without yawing around the Y axis.
- [x] `npm run lint` and `npm run typecheck` pass.

## Completed

### Foundation

- [x] `src/index.css`: warm palette, Fraunces/Instrument Sans/JetBrains Mono, grain, paper/ink surfaces, focus ring, motion utilities, reduced-motion.
- [x] `src/lib/cn.ts` and UI primitives: `Button`/`buttonClass`, `Brand`, `PageHeader`, `StatusBadge`, `EmptyState`, `ConfirmDialog`, `PageTransition`, `Reveal`.
- [x] Skeleton primitive and selected route/stat/catalog/demo presets tokenized.
- [x] Logo-derived palette in `src/index.css`, documented in `docs/color-from-logo.md`, enforced by `scripts/audit-colors.mjs`.
- [x] PhoneShowcase v2 M1 replaced the previous ring scene with the static GLB composition; M2 interaction, M3 fallback, and M4 validation are recorded above.
- [x] Section 3 docs synchronized: `PhoneShowcaseScene`, five WebP previews, CSS fallback, and prior 253.95 kB gzip baseline; legacy hero references removed.

### Section 4 — Typography

- [x] Body copy baseline: 16px mobile / 15px desktop, `1.6` line-height, max `65ch`; tables 14px; inputs 15px; functional text ≥12px; captions/badges ≥13px.
- [x] `.eyebrow` is 13px Instrument Sans, 600, `0.06em` tracking, uppercase; `.font-data` is tabular Instrument Sans.
- [x] Removed 8–13px text classes from app UI and normalized uppercase/tracking; labels/buttons/tables use sentence case.
- [x] Added `app-shell` typography to admin, customer dashboard, and admin login roots; kept `.theme-canvas` isolated.
- [x] Fixed contact AI overflow and empty-state clipping; grew the chat area and used a compact 2-column suggestion grid.
- [x] Fixed remaining contrast failures in sidebars/nav, ShareTab, OrderSuccess, and 404.
- [x] Added reusable `scripts/ui-mocks.mjs`, `scripts/audit-typography.mjs`, and `scripts/capture-typography.mjs`.

### Public and auth

- [x] Public navbar, language switcher, footer, mobile navigation.
- [x] Home, portfolio, contact, tutorial, privacy, terms, 404.
- [x] Login, forgot PIN, reset confirmation with split `AuthShell`.

### Transaction flow

- [x] Order page editorial layout, stepper, details form, payment picker, sticky summary, back action.
- [x] Order success timeline and summary.
- [x] Payment status manual-transfer panel, invoice link, success states.
- [x] Locked order test markup preserved; 44/44 tests passing.

### Customer dashboard

- [x] Dashboard shell, navigation, share/edit/RSVP tabs, RSVP reply modal, pagination, form styling.

### Admin

- [x] Admin login/nav/sidebar and all tabs: orders, WhatsApp, templates, notices, inbox, audit, edit modal.
- [x] Handlers, Supabase queries, PIN/payment actions, and data shapes preserved.

### Demo/invitation shell

- [x] `TemplateDemoPage` fallback, overlay nav, dark chips, language switch, skeleton.
- [x] `.theme-canvas` font isolation for invitation layouts and demo.
- [x] Theme visuals otherwise untouched.

### Accessibility

- [x] Axe audit script and report.
- [x] Contrast, label, landmark, and accessible-name fixes across public/order/auth/payment/tutorial/admin-login/demo routes.
- [x] Final automated result: 0 violations on all 7 audited routes.
- [x] Typography audit: 25 routes × mobile/desktop, 0 size and contrast violations; 0.0% mono.

### Documentation

- [x] `docs/ui-inventory.md`
- [x] `docs/design-system.md`
- [x] `docs/ui-audit.md`
- [x] `ASSUMPTIONS.md`
- [x] `PROGRESS.md`

## Verification

Run on 2026-10-21 after the final typography and accessibility edits:

| Command | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm test` | 44/44 pass (9 files) |
| `npm run build` | Pass; `PhoneShowcaseScene` 938.88 kB / 253.95 kB gzip; `HomePage` 42.97 kB / 11.89 kB gzip |
| `node scripts/audit-colors.mjs` | Pass; 135 app files, 0 raw colors, 0 foreign palette classes, 10 contrast pairs |
| `node scripts/audit-brand.mjs` | Pass; 16 routes |
| `node scripts/audit-a11y.mjs` | 0 violations on home, order, login, payment-status, tutorial, demo, admin-login |
| `node scripts/audit-typography.mjs` | 0 size/contrast violations across 25 routes × 2 viewports; 0.0% mono |

Artifacts: `artifacts/ui/after/`, `artifacts/ui/revision/color/`, `artifacts/ui/revision/showcase/`, and `artifacts/ui/revision/typography/`.

## Known Limitations

- Authenticated dashboard/admin pages are in the typography/contrast audit via `scripts/ui-mocks.mjs`, but the full axe rule set still covers only seven public/auth routes.
- Lighthouse mobile audit ran during PhoneShowcase v2 M4; it scored 45 Performance, 100 Accessibility, 96 Best Practices, and 100 SEO.
- Large full-page Chromium screenshots can display repeated/ghosted text; targeted crops and DOM assertions are the reliable review method. Home-mobile, dashboard, and admin ghosting were confirmed as display artifacts.
- Home mobile first fold still places most of the `PhoneShowcase` below the fold at 390×844.
- Dev-only `/dev/invoice` and `/dev/email` pages are not in the typography audit route list.
- Mono usage is 0.0%; JetBrains Mono is optional for technical data.
- Pre-existing console noise: Midtrans Snap CSP, Supabase `public_invitations` 400, Turnstile 400 on admin login.
- Other invitation themes may share the RSVP select/landmark issues fixed in `MotionFlowTheme`; broad theme remediation is out of scope.

## Not Done

- Phase commits for Sections 3–4 (Section 1–2 commits exist).
- Full axe coverage for authenticated admin/dashboard tabs.
- Optional typography audit coverage for `/dev/invoice` and `/dev/email`.
- Optional mono treatment for technical data if the 0.0% ratio is not desired.

## Suggested Commit Groups (if requested)

1. Design tokens, primitives, skeletons, 3D hero.
2. Public shell/pages and auth.
3. Order/payment flow.
4. Customer dashboard.
5. Admin panel.
6. Demo shell, accessibility fixes and audit script.
7. Documentation, typography audit tooling, and progress artifacts.
