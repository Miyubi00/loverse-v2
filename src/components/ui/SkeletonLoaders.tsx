// ============================================================
// src/components/ui/SkeletonLoaders.tsx
// ------------------------------------------------------------
// Preset placeholder (skeleton) untuk tiap halaman. Memakai primitif
// Skeleton + Tailwind `animate-pulse` — pengganti spinner `Loader2`/border
// di seluruh full-page loading.
// ============================================================
import type { HTMLAttributes } from 'react';
import { Skeleton } from './Skeleton';

const cn = (...classes: (string | false | undefined | null)[]): string =>
  classes.filter(Boolean).join(' ');

/** Full-page spinner branded (ganti PageLoader di App.tsx). */
export function PageSkeleton({ className }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'min-h-screen flex items-center justify-center bg-gray-50 font-sans',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full bg-[#E59A59]/40" />
        <Skeleton className="h-4 w-44 rounded-full" />
      </div>
    </div>
  );
}

/** Statistik 3-item (hero HomePage). */
export function StatsSkeleton() {
  return (
    <div className="flex gap-2 md:gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-20 rounded-xl" />
      ))}
    </div>
  );
}

/** Kartu / katalog template (loading grid HomePage) — raster 347:387, cover di atas. */
export function TemplateCardSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="relative aspect-[347/387] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#EBDFCE] shadow-sm border border-[#EBDFCE]"
        >
          <Skeleton variant="wave" className="absolute inset-0 w-full h-full" />
        </div>
      ))}
    </>
  );
}

/** Skeleton full-page dashboard mempelai (ganti `Memuat data...` Loader2). */
export function DashboardSkeleton() {
  return (
    <div className="flex h-dvh w-full font-sans bg-[#F1E8DC]">
      {/* Mobile header */}
      <div className="lg:hidden h-16 border-b border-[#E5CBA5] p-3 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-6 w-40 rounded" />
      </div>
      {/* Sidebar desktop */}
      <div className="hidden lg:block w-64 border-r border-[#E5CBA5] p-4">
        <Skeleton className="h-8 w-48 rounded mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-xl" />
          ))}
        </div>
      </div>
      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 space-y-6 max-w-3xl">
          <Skeleton className="h-6 w-56 rounded" />
          <Skeleton className="h-4 w-64 rounded" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      </main>
    </div>
  );
}

/** Skeleton undangan tamu (ganti Loader2 + Suspense fallback InvitationPage). */
export function InvitationSkeleton() {
  return (
    <div className="h-screen flex flex-col items-center justify-center font-sans text-gray-500 bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-4 w-44 rounded" />
        <Skeleton className="h-3 w-60 rounded mt-1" />
        <Skeleton className="h-3 w-40 rounded mt-1" />
      </div>
    </div>
  );
}

/** Skeleton status pembayaran (ganti circle animate-pulse PaymentStatusPage). */
export function PaymentStatusSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1E8DC]">
      <div className="flex flex-col items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full bg-[#E59A59]/40" />
        <Skeleton className="h-4 w-48 rounded" />
      </div>
    </div>
  );
}

/* ======================================================= */
/* Skeleton per-halaman (bentuk persis layout masing-masing) */
/* ======================================================= */

function PageSkeletonShell({ tone, children }: { tone: string; children: React.ReactNode }) {
  return <div className={`min-h-screen w-full font-sans ${tone}`}>{children}</div>;
}

function HeroCenterSkeleton({ stats }: { stats?: boolean }) {
  return (
    <div className="text-center max-w-3xl mx-auto space-y-4">
      <Skeleton className="h-7 w-44 mx-auto rounded-full border border-[#EBDFCE] bg-white" />
      <div className="space-y-3">
        <Skeleton className="h-9 md:h-10 w-3/4 mx-auto" />
        <Skeleton className="h-9 md:h-10 w-1/2 mx-auto" />
      </div>
      <Skeleton className="h-4 w-2/3 mx-auto rounded" />
      {stats ? (
        <div className="mx-auto mt-6 grid max-w-2xl grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-white/80" />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#FAF6EE]">
      <section className="border-b border-[#EBDFCE]/60 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 md:pt-14 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col items-start space-y-6">
              <Skeleton className="h-7 w-44 rounded-full bg-white" />
              <div className="w-full space-y-3">
                <Skeleton className="h-8 md:h-10 w-[90%]" />
                <Skeleton className="h-8 md:h-10 w-[70%]" />
                <Skeleton className="h-8 md:h-10 w-[45%]" />
              </div>
              <div className="w-full space-y-2">
                <Skeleton className="h-4 w-[85%] rounded" />
                <Skeleton className="h-4 w-[55%] rounded" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3.5 w-full pt-2">
                <Skeleton className="h-12 w-full sm:w-44 rounded-xl bg-[#E59A59]/50" />
                <Skeleton className="h-12 w-full sm:w-44 rounded-xl bg-white" />
              </div>
              <Skeleton className="h-4 w-36 rounded" />
              <div className="w-full flex items-center gap-4 pt-4 border-t border-[#EBDFCE]">
                <div className="flex -space-x-2.5">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-9 rounded-full ring-2 ring-white" />
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-28 rounded-lg bg-white/70" />
                ))}
              </div>
            </div>
            <div className="lg:col-span-5 mt-4 lg:mt-0">
              <Skeleton variant="wave" className="h-[380px] md:h-[460px] w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </section>
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="text-center mb-10 space-y-3">
          <Skeleton className="h-7 w-52 rounded-full bg-white mx-auto" />
          <Skeleton className="h-8 md:h-10 w-3/5 mx-auto" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="wave" className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      </section>
      <section className="bg-[#F1E8DC] py-14 md:py-20 border-y border-[#EBDFCE]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-14 space-y-3">
            <Skeleton className="h-6 w-48 rounded-full bg-white mx-auto" />
            <Skeleton className="h-8 md:h-10 w-2/3 mx-auto" />
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-3xl bg-white" />
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#712E1E] py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-7 w-2/3 mx-auto mb-8 rounded bg-white/15" />
          <div className="grid grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <Skeleton className="h-9 w-20 mx-auto rounded-lg bg-white/15" />
                <Skeleton className="h-3 w-24 mx-auto rounded bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="katalog" className="bg-[#FAF6EE] py-14 md:py-20 scroll-mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 md:mb-8 space-y-3">
            <Skeleton className="h-6 w-36 rounded-full bg-white mx-auto" />
            <Skeleton className="h-8 md:h-10 w-2/3 mx-auto" />
          </div>
          <div className="flex justify-center gap-2 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-20 rounded-full bg-white border border-[#EBDFCE]" />
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <TemplateCardSkeleton count={8} />
          </div>
        </div>
      </section>
      <section className="py-14 border-t border-[#EBDFCE]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 md:h-10 w-2/5 mx-auto mb-10" />
          <div className="grid sm:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-3xl bg-white" />
            ))}
          </div>
        </div>
      </section>
      <section className="bg-[#FAF6EE] py-14 border-t border-[#EBDFCE]">
        <div className="max-w-3xl mx-auto px-4 space-y-4">
          <Skeleton className="h-8 md:h-10 w-2/5 mb-8" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl bg-white" />
          ))}
        </div>
      </section>
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-24 pt-6">
        <div className="bg-[#712E1E] rounded-3xl p-10 md:p-14 text-center">
          <div className="max-w-xl mx-auto space-y-4">
            <Skeleton className="h-9 w-3/4 mx-auto rounded bg-white/20" />
            <Skeleton className="h-4 w-1/2 mx-auto rounded bg-white/10" />
            <Skeleton className="h-12 w-48 mx-auto mt-4 rounded-xl bg-[#E59A59]/50" />
          </div>
        </div>
      </section>
    </PageSkeletonShell>
  );
}

export function OrderSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#F1E8DC]">
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-5 sm:py-8 md:py-12">
        <div className="flex items-start justify-between gap-3 mb-5 sm:mb-6">
          <div className="min-w-0 flex-1">
            <Skeleton className="h-3.5 w-20 rounded" />
            <Skeleton className="h-8 sm:h-9 w-56 mt-2" />
            <Skeleton className="h-3.5 w-72 mt-2 rounded" />
          </div>
          <Skeleton className="h-9 w-9 sm:w-24 shrink-0 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 flex-1 rounded-full bg-[#E59A59]/40" />
          <Skeleton className="h-1.5 w-8 rounded-full" />
          <Skeleton className="h-10 flex-1 rounded-full bg-white" />
          <Skeleton className="h-1.5 w-8 rounded-full" />
          <Skeleton className="h-10 flex-1 rounded-full bg-white" />
        </div>
        <div className="mt-6 bg-white rounded-3xl border border-[#EBDFCE] shadow-md p-5 sm:p-7 space-y-5">
          <div className="flex items-center gap-4">
            <Skeleton variant="wave" className="h-24 w-20 rounded-xl shrink-0" />
            <div className="min-w-0 flex-1 space-y-2.5">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-6 w-32 rounded-lg" />
            </div>
          </div>
          <div className="pt-3 border-t border-[#EBDFCE] grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3.5 w-28 rounded" />
                <Skeleton className="h-11 rounded-xl" />
              </div>
            ))}
          </div>
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <div className="mt-5 flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 flex-1 rounded-xl bg-[#E59A59]/50" />
        </div>
      </div>
    </PageSkeletonShell>
  );
}

export function OrderSuccessSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#F1E8DC]">
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white p-5 sm:p-10 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg border-t-4 border-[#25D366]/60 space-y-5">
          <div className="flex flex-col items-center">
            <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-green-100" />
            <Skeleton className="h-7 w-56 mt-4 rounded" />
            <Skeleton className="h-3.5 w-64 mt-2 rounded" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#FAF6EE] border border-[#EBDFCE] rounded-xl p-3.5">
                <Skeleton className="h-8 w-8 rounded-xl shrink-0 bg-white" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/5 rounded" />
                  <Skeleton className="h-3 w-3/4 rounded" />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2.5">
            <Skeleton className="h-12 w-full rounded-xl bg-[#25D366]/50" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </PageSkeletonShell>
  );
}

export function LoginSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#F1E8DC]">
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white p-5 sm:p-9 rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-md border border-[#EBDFCE]">
          <div className="text-center mb-7">
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#E59A59]/15 mx-auto" />
            <Skeleton className="h-7 w-48 mx-auto mt-4 rounded" />
            <Skeleton className="h-3.5 w-36 mx-auto mt-2 rounded" />
          </div>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-3.5 w-32 rounded mb-1.5" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3.5 space-y-2">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-11 rounded-xl" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
            <Skeleton className="h-16 rounded-xl" />
            <Skeleton className="h-14 rounded-xl bg-[#E59A59]/50" />
          </div>
        </div>
      </div>
    </PageSkeletonShell>
  );
}

export function ForgotPinSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#F1E8DC]">
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white p-5 sm:p-9 rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-md border border-[#EBDFCE]">
          <div className="text-center mb-7">
            <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#E59A59]/15 mx-auto" />
            <Skeleton className="h-7 w-52 mx-auto mt-4 rounded" />
            <Skeleton className="h-3.5 w-64 mx-auto mt-2 rounded" />
          </div>
          <div className="space-y-4">
            <div>
              <Skeleton className="h-3.5 w-32 rounded mb-1.5" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-3.5 w-36 rounded mb-1.5" />
              <Skeleton className="h-11 rounded-xl" />
            </div>
            <Skeleton className="h-12 rounded-xl bg-[#E59A59]/50" />
          </div>
        </div>
      </div>
    </PageSkeletonShell>
  );
}

export function ForgotPinConfirmSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#F1E8DC]">
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white p-5 sm:p-9 rounded-2xl sm:rounded-3xl shadow-xl w-full max-w-md border border-[#EBDFCE] text-center">
          <Skeleton className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-[#E59A59]/15 mx-auto" />
          <Skeleton className="h-6 w-56 mx-auto mt-5 rounded" />
          <Skeleton className="h-3.5 w-64 mx-auto mt-3 rounded" />
          <Skeleton className="h-3.5 w-44 mx-auto mt-1.5 rounded" />
          <Skeleton className="h-12 w-full mt-6 rounded-xl bg-[#E59A59]/50" />
        </div>
      </div>
    </PageSkeletonShell>
  );
}

export function ContactSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#F1E8DC]">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 md:pt-16 pb-16 sm:pb-24">
        <HeroCenterSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start mt-8 sm:mt-12">
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <section className="space-y-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-2xl bg-white" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-36 rounded" />
                  <Skeleton className="h-3 w-52 rounded" />
                </div>
              </div>
              <Skeleton variant="wave" className="h-44 rounded-2xl" />
            </section>
            <section className="space-y-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 shrink-0 rounded-2xl bg-white" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-56 rounded" />
                </div>
              </div>
              <div className="rounded-3xl bg-[#712E1E]/20 p-5 sm:p-7 space-y-4">
                <div className="flex items-start gap-3.5">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-2xl bg-white/20" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-44 rounded bg-white/25" />
                    <Skeleton className="h-3 w-2/3 rounded bg-white/15" />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <Skeleton className="h-11 flex-1 rounded-xl bg-white/25" />
                  <Skeleton className="h-11 flex-1 rounded-xl bg-white/15" />
                </div>
              </div>
              <Skeleton className="h-28 rounded-2xl bg-white" />
            </section>
          </div>
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            <Skeleton className="h-64 rounded-3xl bg-white" />
            <Skeleton className="h-44 rounded-3xl bg-white" />
            <Skeleton className="h-36 rounded-3xl bg-white" />
          </div>
        </div>
      </div>
    </PageSkeletonShell>
  );
}

export function PortfolioSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#FAF6EE]">
      <section className="border-b border-[#EBDFCE]/60">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <HeroCenterSkeleton stats />
        </div>
      </section>
      <section className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-2.5 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full bg-white border border-[#EBDFCE]" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <article key={i} className="rounded-2xl overflow-hidden border border-[#EBDFCE] bg-white shadow-sm">
              <Skeleton variant="wave" className="aspect-[3/4] w-full rounded-none" />
              <div className="p-4 sm:p-5 space-y-2.5">
                <Skeleton className="h-5 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-3 w-2/5 rounded" />
              </div>
            </article>
          ))}
        </div>
        <div className="mt-14">
          <Skeleton className="h-48 rounded-3xl bg-[#712E1E]/25" />
        </div>
      </section>
    </PageSkeletonShell>
  );
}

export function TutorialSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#FAF6EE]">
      <section className="border-b border-[#EBDFCE]/60">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <HeroCenterSkeleton />
        </div>
      </section>
      {Array.from({ length: 2 }).map((_, g) => (
        <section key={g} className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
          <Skeleton className="h-7 w-56 mx-auto mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl bg-white border border-[#EBDFCE]" />
            ))}
          </div>
        </section>
      ))}
    </PageSkeletonShell>
  );
}

export function LegalSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#FAF6EE]">
      <div className="w-full max-w-3xl mx-auto px-4 py-16">
        <Skeleton className="h-10 w-72 rounded" />
        <Skeleton className="h-5 w-44 rounded-full mt-4" />
        <div className="mt-10 space-y-9">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-5 w-48 rounded" />
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-[85%] rounded" />
              {i % 2 === 1 ? <Skeleton className="h-3.5 w-2/3 rounded" /> : null}
            </div>
          ))}
        </div>
      </div>
    </PageSkeletonShell>
  );
}

export function NotFoundSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#F1E8DC]">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full space-y-4">
          <Skeleton className="h-24 w-24 rounded-full bg-[#FAF6EE] mx-auto border-2 border-[#E59A59]/40" />
          <Skeleton className="h-14 md:h-20 w-44 mx-auto rounded" />
          <Skeleton className="h-6 w-60 mx-auto rounded" />
          <Skeleton className="h-4 w-72 mx-auto rounded" />
          <div className="flex flex-col gap-3 pt-4">
            <Skeleton className="h-12 w-full rounded-xl bg-[#712E1E]/35" />
            <Skeleton className="h-12 w-full rounded-xl bg-white" />
          </div>
        </div>
      </div>
    </PageSkeletonShell>
  );
}

export function AdminSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#F1E8DC]">
      <div className="flex flex-col h-dvh w-full overflow-hidden">
        <div className="flex h-14 shrink-0 items-center gap-3 bg-[#712E1E] px-4">
          <Skeleton className="h-6 w-28 rounded bg-white/20" />
          <Skeleton className="h-3.5 w-44 rounded bg-white/10 ml-auto" />
          <Skeleton className="h-8 w-8 rounded-full bg-white/15" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden lg:flex w-56 shrink-0 flex-col gap-2 border-r border-[#E5CBA5] p-4">
            <Skeleton className="h-9 w-full rounded-xl mb-4" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-xl" />
            ))}
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-7 w-48 rounded" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-24 rounded-xl" />
                  <Skeleton className="h-10 w-28 rounded-xl bg-[#E59A59]/40" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-[#EBDFCE] shadow-sm overflow-hidden">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#EBDFCE]/60 last:border-b-0">
                    <Skeleton className="h-4 w-8 rounded shrink-0" />
                    <Skeleton className="h-4 flex-1 rounded" />
                    <Skeleton className="h-4 w-24 rounded hidden sm:block" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </PageSkeletonShell>
  );
}

export function DemoSkeleton() {
  return (
    <PageSkeletonShell tone="bg-[#FAF6EE]">
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-5">
          <Skeleton variant="wave" className="aspect-[3/4] w-full max-w-xs rounded-3xl shadow-lg" />
          <div className="text-center space-y-2">
            <Skeleton className="h-4 w-40 mx-auto rounded" />
            <Skeleton className="h-3 w-28 mx-auto rounded" />
          </div>
          <Skeleton className="h-11 w-40 rounded-full bg-[#712E1E]/30" />
        </div>
      </div>
    </PageSkeletonShell>
  );
}

export default Skeleton;
