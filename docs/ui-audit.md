# UI and Accessibility Audit

Date: 2026-10-21  
Build: `ui-redesign` worktree, Vite production build passing  
Automated tool: axe-core via `@axe-core/playwright`

## 1. Method

- `scripts/audit-a11y.mjs` launches Chromium (`--disable-gpu`), opens each route at 1440×900, waits for hydration/content, and runs axe with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, and `best-practice`.
- Console errors are captured but are not treated as accessibility violations.
- Visual review used `scripts/capture-ui.mjs` screenshots at desktop and mobile widths; interaction states were captured separately (demo overlay, tutorial modal, order steps, payment variants).
- Quality gates: `npm run lint`, `npm run typecheck`, `npm test` (41/41), `npm run build`.

Run it with the dev server active:

```powershell
node scripts/audit-a11y.mjs
```

Report: `artifacts/ui/after/a11y-report.json`.

## 2. Final Result

| Route | Violations |
| --- | --- |
| `/` | 0 |
| `/order` | 0 |
| `/login` | 0 |
| `/payment-status` | 0 |
| `/tutorial` | 0 |
| `/demo/motion-flow` | 0 |
| admin login (`/panel-daffa11`) | 0 |

**All audited routes are axe-clean** for the configured rule set.

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

## 4. Visual Verification

Screenshots in `artifacts/ui/after/` cover home, order flow, payment status, auth, dashboard, admin login, demo, legal, tutorial, portfolio, contact, and 404 at desktop/mobile widths.

Known screenshot caveat: Chromium/SwiftShader can corrupt glyph rendering (repeated or ghosted text) and full-page captures above roughly 8k px are unreliable. Interaction captures should use:

```text
--disable-gpu --font-render-hinting=none
```

DOM text assertions and targeted crops were used to confirm content in those cases.

## 5. Residual Risks / Not Audited

- **Authenticated dashboard and admin content** are not in the automated axe route list because they need a real/mock session. Login surfaces are audited; dashboard/admin visuals were reviewed via screenshots.
- **Lighthouse** has not been run. Build output is green; the only warning is the lazy `HeroScene` chunk at 935 kB (252 kB gzip), which is expected for the Three.js hero.
- **Console noise** on some pages is pre-existing and unrelated to the redesign: Midtrans Snap CSP warning, Supabase `public_invitations` 400, Turnstile 400/troubleshoot widget on admin login.
- **Invitation themes** retain their original visual system. Only the two `MotionFlowTheme` accessibility attributes above were changed; other themes may have analogous select/landmark issues when opened directly.
- Full keyboard-only walkthrough of every modal was sampled, not exhaustively automated.

## 6. Follow-up

1. Add authenticated dashboard/admin routes to the axe script once a reusable mock session is factored out of `capture-ui.mjs`.
2. Run Lighthouse against `vite preview` if performance scoring is required; ignore simulated throttling differences from CI.
3. If theme accessibility becomes in scope, audit all 40 RSVP selects and cover landmarks across `src/templates/themes/`.
