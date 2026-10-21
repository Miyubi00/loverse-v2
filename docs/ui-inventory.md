# UI Inventory

Scope: LoVerse app surfaces redesigned in this pass. Invitation themes are intentionally out of scope except isolation/accessibility fixes.

## Route Matrix

| Route | Layout / shell | Primary components | Status |
| --- | --- | --- | --- |
| `/` | `PublicLayout` | `Navbar`, `PhoneShowcase`/`PhoneShowcaseScene`/`PhoneShowcaseFallback`, `PublicFooter`, `HomePage`, `TemplateCatalogCard` | Redesigned |
| `/portfolio` | `PublicLayout` | `PortfolioPage`, `PageHeader`, `Reveal` | Redesigned |
| `/contact` | `PublicLayout` | `ContactPage`, `PageHeader`, form primitives | Redesigned |
| `/tutorial` | `PublicLayout` | `TutorialPage`, video modal, step cards | Redesigned |
| `/privacy` | `PublicLayout` | `PrivacyPolicyPage` → `LegalPage` | Redesigned |
| `/terms` | `PublicLayout` | `TermsPage` → `LegalPage` | Redesigned |
| `*` | `PublicLayout` | `NotFoundPage` | Redesigned |
| `/order` | `PublicLayout` | `OrderPage`, `OrderDetailsForm`, `OrderSteps`, `PaymentMethodPicker`, `OrderSummary`, `OrderBackButton` | Redesigned; locked test markup |
| `/order/success` | `PublicLayout` | `OrderSuccessPage` timeline, summary | Redesigned |
| `/payment-status` | `PublicLayout` | `PaymentStatusPage`, manual transfer panel, invoice link | Redesigned |
| `/login` | `AuthShell` | `CustomerLoginPage` | Redesigned |
| `/forgot-pin` | `AuthShell` | `ForgotPinPage` | Redesigned |
| `/forgot-pin/confirm` | `AuthShell` | `ForgotPinConfirmPage` | Redesigned |
| `/dashboard/:orderId` | `CustomerNavbar` + `CustomerSidebar` | `CustomerDashboardPage`, `ShareTab`, `EditTab`, `RsvpTab`, `RsvpReplyModal`, `Pagination` | Redesigned |
| `/demo/:slug` | Theme canvas | `TemplateDemoPage`, overlay nav, language switch, skeleton/fallback | Redesigned shell; theme visuals untouched |
| `/wedding/:slug` | `InvitationLayout` | Theme renderer | Not redesigned; `.theme-canvas` isolation only |
| `ADMIN_PATH` (`/panel-daffa11`) | `AdminNavbar` + `AdminSidebar` | `AdminPanelPage`, `AdminLogin` | Redesigned |
| Admin tab `orders` | Admin shell | `OrdersTab`, `EditOrderModal` | Redesigned |
| Admin tab `whatsapp` | Admin shell | `OrdersTab` WA flow | Redesigned |
| Admin tab `templates` | Admin shell | `TemplatesTab` | Redesigned |
| Admin tab `notices` | Admin shell | `NoticesTab` | Redesigned |
| Admin tab `inbox` | Admin shell | `InboxTab` | Redesigned |
| Admin tab `audit` | Admin shell | `AuditTab` | Redesigned |
| Admin tab `edit` | Admin shell | `EditOrderModal` | Redesigned |
| `/dev/invoice`, `/dev/email` | Dev preview | Invoice/email previews | Styles inherited; not a primary redesign target |

## Shared UI

### Primitives

- `src/components/ui/Button.tsx` + `buttonStyles.ts` — six variants, three sizes, shared focus/disabled behavior.
- `src/components/ui/Brand.tsx` — LoVerse wordmark/lockup.
- `src/components/ui/PageHeader.tsx` — editorial page intro.
- `src/components/ui/StatusBadge.tsx` — order/payment/RSVP status.
- `src/components/ui/EmptyState.tsx` — zero-data panel.
- `src/components/ui/ConfirmDialog.tsx` — accessible confirmation.
- `src/components/ui/PageTransition.tsx` — route transition wrapper.
- `src/components/ui/Reveal.tsx` — reduced-motion-aware entrance.
- `src/components/ui/Skeleton.tsx` + `SkeletonLoaders.tsx` — loading states; selected presets tokenized.

### Shared

- `src/components/shared/PublicFooter.tsx`, `LegalPage.tsx`, `AuthShell.tsx`.
- `src/components/shared/Pagination.tsx` — dashboard/admin list paging.
- `src/components/shared/TemplateCatalogCard.tsx` — catalog card with preview/link semantics.
- `src/components/shared/form/ui.ts`, `FormKit.tsx`, `SectionCards.tsx` — field styling and section patterns.
- `src/components/shared/SiteNoticeView.tsx` — notices surface.

### Navigation

- `src/components/Navbar.tsx` + `LanguageSwitcher` — public navigation, mobile sheet.
- `src/components/customer/CustomerNavbar.tsx`, `CustomerSidebar.tsx`.
- `src/components/admin/AdminNavbar.tsx`, `AdminSidebar.tsx`.

## Transaction Components

`src/components/order/`:

- `OrderDetailsForm.tsx` — labeled groom/bride/date/email/WhatsApp fields; exactly one white section and locked divider/CTA text for tests.
- `OrderSteps.tsx` — three-step progress; active step ember-600.
- `PaymentMethodPicker.tsx` — bank/e-wallet selection cards.
- `OrderSummary.tsx` — sticky summary and locked pay-button sizing.
- `OrderBackButton.tsx` — shared back action (`min-h-11`).

## Admin Components

`src/components/admin/`:

- `AdminLogin.tsx` — dark editorial login with Turnstile.
- `OrdersTab.tsx` — dense order table, filters, actions, WhatsApp flow.
- `TemplatesTab.tsx` — template management cards/table.
- `NoticesTab.tsx` — notice authoring and publishing.
- `InboxTab.tsx` — contact inbox and reply.
- `AuditTab.tsx` — read-only audit log.
- `EditOrderModal.tsx` — order edit form using shared form primitives.

All handlers, Supabase calls, PIN/payment actions, and data shapes are preserved.

## Invitation Surfaces

- `src/layouts/InvitationLayout.tsx` — applies `.theme-canvas` so theme fonts do not leak into app UI.
- `src/pages/TemplateDemoPage.tsx` — fixed overlay navigation, dark chips, branded not-found fallback, demo skeleton.
- `src/templates/themes/*` — visual contract preserved. Only `MotionFlowTheme` received accessibility attributes (RSVP select label, cover region); no theme redesign.

## Style Entry Points

- `src/index.css` — tokens, base styles, utilities, skeleton/entrance keyframes, reduced-motion.
- `src/lib/cn.ts` — class merge helper.
- `tailwind.config.*` is not the source of truth; Tailwind 4 `@theme` tokens in `index.css` are.
