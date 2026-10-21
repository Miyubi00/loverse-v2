# LoVerse UI Redesign — Progress

Status: **Sections 1–2 committed; Sections 3–4 implemented and validated; phase commits pending.**

## Completed

### Foundation

- [x] `src/index.css`: warm palette, Fraunces/Instrument Sans/JetBrains Mono, grain, paper/ink surfaces, focus ring, motion utilities, reduced-motion.
- [x] `src/lib/cn.ts` and UI primitives: `Button`/`buttonClass`, `Brand`, `PageHeader`, `StatusBadge`, `EmptyState`, `ConfirmDialog`, `PageTransition`, `Reveal`.
- [x] Skeleton primitive and selected route/stat/catalog/demo presets tokenized.
- [x] Logo-derived palette in `src/index.css`, documented in `docs/color-from-logo.md`, enforced by `scripts/audit-colors.mjs`.
- [x] Lazy `PhoneShowcase` ring with five real preview textures, drag/inertia/snap, idle rotation, DOM controls, reduced-motion/no-WebGL CSS fallback, and DPR/visibility pausing.
- [x] Section 3 docs synchronized: `PhoneShowcaseScene`, five WebP previews, CSS fallback, and 253.95 kB gzip chunk; legacy hero references removed.

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
- Lighthouse has not been run.
- Large full-page Chromium screenshots can display repeated/ghosted text; targeted crops and DOM assertions are the reliable review method. Home-mobile, dashboard, and admin ghosting were confirmed as display artifacts.
- Home mobile first fold still places most of the `PhoneShowcase` below the fold at 390×844.
- Dev-only `/dev/invoice` and `/dev/email` pages are not in the typography audit route list.
- Mono usage is 0.0%; JetBrains Mono is optional for technical data.
- Pre-existing console noise: Midtrans Snap CSP, Supabase `public_invitations` 400, Turnstile 400 on admin login.
- Other invitation themes may share the RSVP select/landmark issues fixed in `MotionFlowTheme`; broad theme remediation is out of scope.

## Not Done

- Phase commits for Sections 3–4 (Section 1–2 commits exist).
- Optional Lighthouse run and full axe coverage for authenticated admin/dashboard tabs.
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
