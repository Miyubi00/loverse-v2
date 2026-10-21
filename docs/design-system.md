# LoVerse Design System

Status: implemented in the `ui-redesign` worktree. Source of truth is `src/index.css` plus the primitives in `src/components/ui/`.

## 1. Principles

1. **Warm love universe.** Cream paper, peach light, ember accent, ink typography. No purple/blue gradients, neon, or starfields.
2. **Editorial, not generic SaaS.** Asymmetric grids, expressive display type, hairline rules, mono metadata, deliberate whitespace.
3. **One accent does the work.** Ember marks action and emphasis. Peach is a surface, not a second action color.
4. **Quiet depth.** Sharp 2–3px corners, hairline borders, grain, and restrained shadow. Avoid stacked `rounded-2xl + shadow-lg` cards.
5. **Behavior is untouchable.** Styling may change markup wrappers, but routes, requests, auth, pricing, payment, and invitation contracts do not.

## 2. Foundations

### Color

Defined as Tailwind 4 tokens in `src/index.css`.

| Token | Hex | Use |
| --- | --- | --- |
| `ink-950` | `#17100C` | Primary text, dark panels, primary buttons |
| `ink-900` | `#241813` | Body text, borders |
| `ink-800` | `#34231B` | Strong secondary text |
| `ink-700` | `#4A3328` | Secondary text |
| `ink-600` | `#5F4638` | Muted text on light |
| `ink-500` | `#7A6152` | Muted metadata |
| `ink-400` | `#7F6A5C` | Minimum muted text on cream; meets 4.5:1 |
| `ink-300` | `#BFAE9F` | Decorative only, never body copy |
| `cream-50` | `#FDFAF3` | Paper highlight, text on ink |
| `cream-100` | `#F8F1E4` | App background |
| `cream-200` | `#F0E5D2` | Subtle fills |
| `cream-300` | `#E4D4BB` | Disabled/decorative |
| `cream-400` | `#D4BFA0` | Decorative rules |
| `peach-100` | `#FFF1E2` | Lightest accent surface |
| `peach-200` | `#FFE3C9` | Accent surface |
| `peach-300` | `#FFD6B2` | Signature peach; light CTA |
| `peach-400` | `#F3BB8B` | Peach hover |
| `ember-400` | `#D87844` | Accent graphic |
| `ember-500` | `#B85A28` | Focus ring, decorative accent |
| `ember-600` | `#9E4319` | Ember text/CTA hover; use on cream for contrast |
| `ember-700` | `#7F3414` | Ember text on peach/cream |
| `wine-800/900` | `#4A1F2A` / `#35141D` | Editorial dark accent |
| `forest-800/900` | `#1E3B30` / `#142C24` | Calm dark accent |
| `gold-500/600` | `#B08A4F` / `#96713B` | Premium detail, not body text |
| `success-600/700` | `#2F6B4F` / `#24543E` | Paid/confirmed states |
| `danger-600/700` | `#A83A2C` / `#8B2D23` | Destructive/error |

Legacy `brand-*` aliases remain for older components. Invitation palette tokens (`mf-*`, `pc-*`, `ln-*`, etc.) are template contracts and must not be edited.

**Contrast rules**

- Use `ink-400` or darker for readable text on cream/peach.
- Do not use `ink-300` for copy.
- Prefer `ember-600` for ember-colored text on light surfaces; `ember-500` is for focus rings/large graphics.
- On ink surfaces use `cream-50`/`cream-100`; opacity below `/70` is decorative only.
- Verify state text (`success`, `danger`) with axe before merging.

### Typography

| Role | Font | Token/utility |
| --- | --- | --- |
| Display | Fraunces | `font-display`, `.display-xl`, `.display-lg` |
| Body/UI | Instrument Sans | `font-sans` (default) |
| Data/labels | JetBrains Mono | `font-mono`, `.eyebrow` |

- `.eyebrow`: 10px mono, `0.22em` tracking, uppercase.
- `.display-xl`: Fraunces, `-0.035em`, `0.94` line-height, SOFT 40/WONK 1.
- `.display-lg`: Fraunces, `-0.03em`, line-height `1`.
- Headings use `text-wrap: balance`; prose uses `.text-pretty`.
- Do not add Inter, Roboto, Arial, Poppins, Playfair, or Space Grotesk to app UI. Themes keep their own fonts under `.theme-canvas`.

### Layout and shape

- App shell: max width `7xl` (80rem), gutters `px-4 sm:px-6 lg:px-8`.
- Radius: buttons/inputs/cards `2–3px` (`rounded-[2px]`/`rounded-[3px]`); pills only for badges/status.
- Borders: 1px hairline via `.rule` or `border-ink-900/10–15`.
- Shadows: `shadow-lift` and `shadow-deep` only; no shadow on every card.
- Texture: `.grain` / `.grain-light` for hero and editorial panels.
- Surfaces: `.paper-panel` (cream + hairline), `.ink-panel` (dark/cream), `.ticket-edge` for ticket-shaped totals.

### Motion

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` for entrances; `ease-out` for color/border transitions.
- Durations: 200ms interaction, 400–700ms entrance, 9s+ ambient drift only.
- Utilities: `.animate-rise`, `.animate-fade-in`, `.animate-fade-in-up`, `.animate-drift`, `.page-enter`, `.animate-msg-in`.
- Respect `prefers-reduced-motion`; all CSS animation utilities are disabled there.
- No gratuitous bounce, pulse, or perpetual scale on interactive elements.

## 3. Components

### Buttons

Import `buttonClass(variant, size, className)` from `src/components/ui/buttonStyles.ts` when the element must remain a link/handler. Use `Button` only when a real `<button>` fits.

| Variant | Appearance | Use |
| --- | --- | --- |
| `primary` | ink fill, cream text, ember hover | Main action |
| `peach` | peach fill, ink text | Warm secondary CTA |
| `secondary` | transparent, ink border | Neutral action |
| `ghost` | transparent, no border | Tertiary/toolbar |
| `danger` | danger fill, white text | Destructive confirm |
| `outlineLight` | cream outline on dark | Action on ink |

Sizes: `sm` 36px, `md` 44px (`min-h-11`), `lg` 52px. All use 3px radius, 600 weight, visible `ember-500` focus ring, and disabled opacity. Keep `min-h-11` on order-flow buttons where tests require it.

### Forms

- Shared field styling lives in `src/components/shared/form/ui.ts`; form primitives in `FormKit.tsx`.
- Label above input, mono uppercase hint optional, 2–3px radius, cream/white field on paper.
- Every control needs an associated label (`htmlFor`/`id`) or `aria-label`; errors use `role="alert"`/`aria-live` and visible text, not color alone.
- Order form labels use `order-*` ids and are locked by tests.

### Status and data

- `StatusBadge` for order/payment/RSVP state; pair color with text.
- Table header uses mono uppercase microcopy; rows use hairline rules, no zebra stripes.
- Counts and IDs use `font-mono`.
- `EmptyState` for zero-data cases with one clear action.
- Loading uses `Skeleton` (`pulse` default, `wave` shimmer) and the tokenized `PageSkeleton`, `StatsSkeleton`, `TemplateCardSkeleton`, `DemoSkeleton`. Legacy presets may remain until touched.

### Navigation and overlays

- Public navbar: cream translucent bar, ink wordmark, peach CTA, mobile sheet with focusable close.
- Dashboard/admin: dark ink sidebar on desktop, compact top bar/mobile drawer; active item uses peach rule or ember marker, not a filled rainbow gradient.
- Dialogs: `ui/ConfirmDialog` with backdrop, focus handling, explicit cancel/confirm; overlay chips on demo use ink background and cream text.
- Demo overlay is `<nav aria-label="Demo">`; theme cover is a labeled region.

## 4. Page Patterns

- **Public:** editorial hero → proof strip → asymmetric feature grid → catalog → process → FAQ → CTA. Section eyebrows in mono; generous vertical rhythm (`py-20`–`py-28`).
- **Order:** two-column form with sticky summary on desktop; stepper with ember-600 active state; single paper panel per section, hairline dividers.
- **Payment:** status-first header, ticket-shaped total, explicit manual-transfer instructions, accessible copy buttons, success tokens for paid state.
- **Dashboard:** sidebar + content header; tabs share `Pagination`, form primitives, and paper panels; mobile tabs scroll horizontally.
- **Admin:** dense but calm; mono metadata, compact tables, row actions in ghost buttons, modals for edits; preserve all handlers and `data-*` hooks.
- **Invitations:** untouched visual system. `.theme-canvas` isolates theme fonts from app typography. Only layout/font-isolation/a11y fixes belong here.

## 5. Accessibility Baseline

- Target WCAG 2.1 AA for app UI.
- One `<main>` per page; landmarks must contain page content.
- Inputs labeled; icon-only buttons need accessible names; decorative icons `aria-hidden`.
- Focus visible on all interactive elements; do not remove outlines.
- Dialog/menu focus management and Escape close.
- Reduced motion disables non-essential animation and 3D.
- Run `node scripts/audit-a11y.mjs` after UI changes (requires the dev server on `127.0.0.1:5173`).

## 6. 3D Rules

Allowed: landing hero, optional catalog accent, payment success. Never dashboard/admin.

- Procedural geometry only; no external models/textures.
- Lazy-load with `React.lazy`/dynamic import; DPR capped at 1.5–2.
- Fallback to static art on reduced motion, Save-Data, low GPU, or load failure.
- Canvas is `aria-hidden`; meaningful copy stays in DOM.
- Keep `HeroScene` as a separate chunk; current build warns it exceeds 500 kB, which is expected and non-fatal.

## 7. Do / Don't

Do: use tokens, Fraunces for display, mono for data, hairline rules, peach/ember/ink, 2–3px radii, one primary action per view.

Don't: add new raw hex values, use `ink-300` for copy, use ember-500 for small text on cream, introduce purple/neon, stack identical rounded cards, hide content in canvas, or restyle invitation themes.
