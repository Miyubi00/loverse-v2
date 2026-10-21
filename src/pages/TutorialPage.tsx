import { useState } from "react";
import { BookOpen, ListOrdered, Lock, Pencil, Play, Share2, ShoppingCart, X } from "lucide-react";
import { TUTORIAL_ITEMS, type TutorialItem } from "../lib/tutorialData";
import { useTranslation } from "../i18n";
import { usePageMeta } from "../hooks/usePageMeta";
import { id as idDict } from "../i18n/locales/id";
import { en as enDict } from "../i18n/locales/en";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import { cn } from "../lib/cn";

const ICONS = { cart: ShoppingCart, lock: Lock, edit: Pencil, share: Share2, book: BookOpen } as const;

function VideoModal({ youtubeId, title, onClose }: { youtubeId: string; title: string; onClose: () => void }) {
  const { t } = useTranslation();

  return (
    <Modal
      onClose={onClose}
      ariaLabel={title}
      overlayClassName="items-center justify-center bg-ink-950/85 p-4 backdrop-blur-[3px] sm:p-6"
      panelClassName="w-full max-w-5xl"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="truncate font-display text-lg tracking-[-0.02em] text-cream-50 sm:text-xl">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("tutorial.videoClose")}
          className="flex h-9 w-9 shrink-0 items-center justify-center border border-cream-100/20 text-cream-50 transition hover:bg-cream-50 hover:text-ink-950"
        >
          <X size={17} />
        </button>
      </div>
      <div className="aspect-video w-full overflow-hidden bg-ink-950 shadow-deep">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    </Modal>
  );
}

function TutorialCard({ item, index }: { item: TutorialItem; index: number }) {
  const { t, language } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const base = `tutorial.items.${item.id}` as const;
  const title = t(`${base}.title`);
  const desc = t(`${base}.desc`);
  const dict = language === "en" ? enDict : idDict;
  const steps = (dict.tutorial.items[item.id] as unknown as { steps: readonly string[] }).steps;
  const Icon = ICONS[item.icon];
  const reverse = index % 2 === 1;

  return (
    <article className="grid gap-8 border-t border-ink-900/15 py-10 sm:py-12 lg:grid-cols-12 lg:gap-10">
      <div className={cn("lg:col-span-5", reverse && "lg:order-2")}>
        <div className="relative aspect-video overflow-hidden bg-ink-950">
          {item.youtubeId ? (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="group absolute inset-0 h-full w-full cursor-pointer"
            >
              <span className="sr-only">
                {t("tutorial.videoPlay")}: {title} ({item.duration})
              </span>
              <img
                src={`https://i.ytimg.com/vi/${item.youtubeId}/hqdefault.jpg`}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover opacity-85 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100"
                onError={(event) => {
                  event.currentTarget.src = `https://i.ytimg.com/vi/${item.youtubeId}/mqdefault.jpg`;
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-cream-50/40 bg-ink-950/35 text-cream-50 backdrop-blur-md transition duration-300 group-hover:scale-110 group-hover:bg-cream-50 group-hover:text-ink-950">
                  <Play size={20} className="ml-0.5 fill-current" />
                </span>
              </span>
              <span aria-hidden="true" className="absolute bottom-3 right-3 font-data text-[14px] text-cream-50/75">
                {item.duration}
              </span>
            </button>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-cream-100/40">
              <Play className="h-6 w-6" />
              <p className="font-data text-[14px] uppercase tracking-[0.06em]">{t("tutorial.videoSoon")}</p>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="eyebrow text-ink-400">Lesson 0{index + 1}</span>
          <span className="font-data text-[14px] uppercase tracking-[0.06em] text-ember-600">{item.duration}</span>
        </div>
      </div>

      <div className={cn("lg:col-span-7", reverse && "lg:order-1")}>
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 text-ember-600" strokeWidth={1.5} />
              <p className="eyebrow text-ink-400">{desc}</p>
            </div>
            <h3 className="mt-3 font-display text-[clamp(1.8rem,3.4vw,2.7rem)] leading-[0.98] tracking-[-0.04em] text-ink-950">
              {title}
            </h3>
          </div>
          <span className="font-data text-[14px] text-ink-400">0{index + 1}</span>
        </div>

        <p className="mt-6 flex items-center gap-1.5 font-data text-[14px] uppercase tracking-[0.06em] text-ember-600">
          <ListOrdered className="h-3 w-3" /> {t("tutorial.stepsLabel")}
        </p>
        <ol className="mt-3">
          {steps.map((step, stepIndex) => (
            <li key={stepIndex} className="grid grid-cols-[auto_1fr] gap-4 border-b border-ink-900/10 py-3.5 text-[14px] leading-relaxed text-ink-600 last:border-b-0">
              <span className="font-display text-lg leading-none text-ink-400">{String(stepIndex + 1).padStart(2, "0")}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {playing && item.youtubeId && (
        <VideoModal youtubeId={item.youtubeId} title={title} onClose={() => setPlaying(false)} />
      )}
    </article>
  );
}

export default function TutorialPage() {
  const { t } = useTranslation();
  usePageMeta(
    "Tutorial Undangan Digital — LoVerse",
    "Panduan video dan langkah tertulis: cara pesan undangan, edit undangan, lupa PIN, bagikan undangan, dan cek RSVP & buku tamu LoVerse.",
  );
  const orders = TUTORIAL_ITEMS.filter((item) => item.group === "order");
  const setups = TUTORIAL_ITEMS.filter((item) => item.group === "setup");
  let runningIndex = 0;

  return (
    <div className="min-h-screen bg-cream-100 text-ink-900">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-7 lg:px-10">
        <PageHeader
          eyebrow={t("tutorial.badge")}
          index="03"
          title={<>{t("tutorial.title")}</>}
          description={t("tutorial.subtitle")}
          aside={
            <div className="flex items-center gap-3 font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
              <Play className="h-3.5 w-3.5 text-ember-600" />
              {orders.length + setups.length} panduan · video + teks
            </div>
          }
        />

        {[
          { key: "order", title: t("tutorial.groupOrder"), items: orders },
          { key: "setup", title: t("tutorial.groupSetup"), items: setups },
        ].map((group) => (
          <section key={group.key} className="py-10 sm:py-14">
            <div className="flex items-end justify-between gap-5 pb-5">
              <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] tracking-[-0.04em] text-ink-950">{group.title}</h2>
              <span className="font-data text-[14px] uppercase tracking-[0.06em] text-ink-400">
                {String(group.items.length).padStart(2, "0")} lessons
              </span>
            </div>
            <div>
              {group.items.map((item) => {
                const card = <TutorialCard key={item.id} item={item} index={runningIndex} />;
                runningIndex += 1;
                return card;
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
