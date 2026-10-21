// ============================================================
// src/components/shared/form/ui.ts
// ------------------------------------------------------------
// Design token form bersama (CARD, CARD_TITLE, FIELD_LABEL, ICON_CHIP, INPUT) - satu sumber gaya agar seragam.
// Dipakai di  : FormKit, SectionCards, ShareTab, EditOrderModal
// Keterikatan : -(murni konstanta string Tailwind)
// ============================================================

export const CARD =
  'space-y-5 border border-ink-900/12 bg-cream-50 p-5 sm:p-6';

export const CARD_TITLE =
  'flex items-center gap-2.5 text-[14px] font-semibold tracking-[-0.01em] text-ink-900';

export const ICON_CHIP =
  'grid h-8 w-8 place-items-center border border-ink-900/10 bg-cream-100 text-ember-600';

export const FIELD_LABEL =
  'block font-data text-[14px] uppercase tracking-[0.06em] text-ink-400';

export const INPUT =
  'w-full border border-ink-900/15 bg-cream-50 px-3 py-2.5 text-[14px] text-ink-900 ' +
  'placeholder:text-ink-300 outline-none transition ' +
  'focus:border-ember-500 focus:ring-2 focus:ring-ember-500/15';
