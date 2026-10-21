# Assumptions

## Scope

1. This pass is a **UI/UX redesign**, not a product rewrite. Routes, copy keys, request fields, pricing, auth/PIN, payment/webhook behavior, Supabase schema/RLS, edge functions, and invitation data contracts stay unchanged.
2. Invitation themes are a **visual contract** and are not redesigned. Only font isolation (`.theme-canvas`), demo-shell accessibility, and isolated layout bugs are in scope.
3. Admin screens are included; they were redesigned behind the existing `ADMIN_PATH` and auth flow.
4. Existing tests encode required markup and behavior. `OrderDetailsForm` and `OrderSummary` structures were preserved rather than “cleaned up.”
5. New visual direction is “warm love universe”: cream/peach/ember/ink, Fraunces + Instrument Sans + JetBrains Mono, 2–3px corners, editorial asymmetry. This replaces the previous generic SaaS styling without changing brand naming.
6. 3D is decorative and progressive. It is limited to landing/catalog accents/payment success, lazy-loaded, capped, and always backed by DOM text and a static fallback.
7. Placeholder/demo data shown in screenshots is mock data from `scripts/capture-ui.mjs`; it is not production data.
8. Existing i18n keys are preserved. New visible strings were added through existing locale files where required; no mass translation rewrite was performed.
9. The accessibility target is WCAG 2.1 AA for app UI, audited with axe on seven key routes. Authenticated dashboard/admin pages are visually reviewed but not yet in the automated route list.
10. Screenshot artifacts are for design review, not pixel-diff baselines. SwiftShader glyph corruption and very tall full-page capture limits are known environment issues.
11. No commits are created as part of this work unless explicitly requested. Phase commits, if wanted, should be made after review.
12. The production build warning for the lazy `HeroScene` chunk (>500 kB) is accepted for now; code-splitting already prevents it from blocking first paint of non-3D routes.
