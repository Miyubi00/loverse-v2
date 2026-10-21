# Assumptions

## Scope

1. This pass is a **UI/UX redesign**, not a product rewrite. Routes, copy keys, request fields, pricing, auth/PIN, payment/webhook behavior, Supabase schema/RLS, edge functions, and invitation data contracts stay unchanged.
2. Invitation themes are a **visual contract** and are not redesigned. Only font isolation (`.theme-canvas`), demo-shell accessibility, and isolated layout bugs are in scope.
3. Admin screens are included; they were redesigned behind the existing `ADMIN_PATH` and auth flow.
4. Existing tests encode required markup and behavior. `OrderDetailsForm` and `OrderSummary` structures were preserved rather than “cleaned up.”
5. New visual direction is “warm love universe”: cream/peach/ember/ink, Fraunces + Instrument Sans + JetBrains Mono, 2–3px corners, editorial asymmetry. This replaces the previous generic SaaS styling without changing brand naming.
6. 3D is decorative and progressive. `PhoneShowcase` is limited to the landing hero, lazy-loaded, DPR-capped, and always backed by DOM controls plus a CSS phone-stack fallback. It uses local WebP preview textures, not external models or remote assets.
7. Placeholder/demo data shown in screenshots is mock data from `scripts/capture-ui.mjs`; it is not production data.
8. Existing i18n keys are preserved. New visible strings were added through existing locale files where required; no mass translation rewrite was performed.
9. The accessibility target is WCAG 2.1 AA for app UI. Full axe coverage is seven key public/auth routes; authenticated dashboard/admin tabs are covered by the typography and color-contrast audit through `scripts/ui-mocks.mjs`.
10. Screenshot artifacts are for design review, not pixel-diff baselines. Large full-page captures can render repeated/ghosted text in the viewer even when the DOM and cropped captures are clean.
11. No additional commits are created unless explicitly requested. Section 1–2 commits (`d12463f`, `1141140`) exist; Section 3–4 changes remain uncommitted until requested.
12. The production build warning for the lazy `PhoneShowcaseScene` chunk (>500 kB) is accepted; it is ~254 kB gzip, under the 300 kB target, and code-splitting prevents it from blocking first paint of non-3D routes.
13. Section 4 typography uses Instrument Sans for body/UI and tabular data. JetBrains Mono is optional for technical-only values and currently accounts for 0.0% of rendered text; invitation themes remain isolated under `.theme-canvas`.
