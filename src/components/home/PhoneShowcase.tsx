import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import useDeviceCapability from "../../hooks/useDeviceCapability";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/cn";
import PhoneShowcaseFallback from "./PhoneShowcaseFallback";
import { SHOWCASE_TEMPLATES } from "./showcaseTemplates";

const PhoneShowcaseScene = lazy(() => import("../three/PhoneShowcaseScene"));
const AUTO_ADVANCE_MS = 6000;

class SceneBoundary extends Component<
  { onError: () => void; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function PhoneShowcase() {
  const { t } = useTranslation();
  const { ready, canRender3D, reducedMotion } = useDeviceCapability();
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const [inView, setInView] = useState(() => !("IntersectionObserver" in window));
  const [documentVisible, setDocumentVisible] = useState(() => document.visibilityState === "visible");
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  const active = SHOWCASE_TEMPLATES[activeIndex];
  const previous = SHOWCASE_TEMPLATES[(activeIndex - 1 + SHOWCASE_TEMPLATES.length) % SHOWCASE_TEMPLATES.length];
  const next = SHOWCASE_TEMPLATES[(activeIndex + 1) % SHOWCASE_TEMPLATES.length];

  useEffect(() => {
    const node = rootRef.current;
    if (!node || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "160px",
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const syncVisibility = () => setDocumentVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", syncVisibility);
    return () => document.removeEventListener("visibilitychange", syncVisibility);
  }, []);

  useEffect(() => {
    if (!ready || !canRender3D || !inView) return;
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setMounted(true), { timeout: 1200 })
      : window.setTimeout(() => setMounted(true), 350);

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number);
      window.clearTimeout(idle as number);
    };
  }, [ready, canRender3D, inView]);

  useEffect(() => {
    for (let offset = 1; offset <= 2; offset += 1) {
      const image = new Image();
      image.decoding = "async";
      image.src = SHOWCASE_TEMPLATES[(activeIndex + offset) % SHOWCASE_TEMPLATES.length].image;
    }
  }, [activeIndex]);

  const select = useCallback((index: number) => {
    const normalized = ((index % SHOWCASE_TEMPLATES.length) + SHOWCASE_TEMPLATES.length) % SHOWCASE_TEMPLATES.length;
    setActiveIndex(normalized);
    setAnnouncement(
      `Template ${normalized + 1} dari ${SHOWCASE_TEMPLATES.length}: ${SHOWCASE_TEMPLATES[normalized].name}`,
    );
  }, []);

  useEffect(() => {
    if (
      !ready ||
      reducedMotion ||
      !inView ||
      !documentVisible ||
      hovered ||
      focusWithin ||
      interacting
    ) {
      return;
    }
    const timer = window.setTimeout(() => select(activeIndex + 1), AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [
    activeIndex,
    documentVisible,
    focusWithin,
    hovered,
    inView,
    interacting,
    ready,
    reducedMotion,
    select,
  ]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      select(activeIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      select(activeIndex + 1);
    }
  };

  const onBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusWithin(false);
  };

  const sceneActive = mounted && canRender3D && !contextLost;
  const sceneVisible = sceneActive && sceneReady;
  const paused = !inView || !documentVisible;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Pratinjau template undangan"
      tabIndex={0}
      data-index={activeIndex}
      data-showcase-index={activeIndex}
      data-showcase-mode={sceneVisible ? "webgl" : "fallback"}
      className="group relative flex h-full w-full select-none flex-col overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-peach-300/70"
      style={{ touchAction: "pan-y" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={onBlurCapture}
      onKeyDown={onKeyDown}
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 52% 43%, color-mix(in srgb, var(--color-peach-300) 14%, transparent), transparent 58%), radial-gradient(ellipse at 75% 78%, color-mix(in srgb, var(--color-ember-600) 12%, transparent), transparent 62%)",
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-10 bottom-8 h-px opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(90deg, transparent, color-mix(in srgb, var(--color-peach-300) 44%, transparent), transparent)",
          }}
          aria-hidden="true"
        />

        <div
          className={cn(
            "absolute inset-0 z-[2] transition-opacity duration-500",
            sceneVisible ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          data-phone-canvas=""
        >
          {sceneActive ? (
            <SceneBoundary onError={() => setContextLost(true)}>
              <Suspense fallback={null}>
                <PhoneShowcaseScene
                  activeIndex={activeIndex}
                  onIndexChange={select}
                  paused={paused}
                  autoRotate={!hovered && !focusWithin}
                  onInteractStart={() => setInteracting(true)}
                  onInteractEnd={() => setInteracting(false)}
                  onReady={() => setSceneReady(true)}
                  onContextLost={() => {
                    setSceneReady(false);
                    setContextLost(true);
                  }}
                />
              </Suspense>
            </SceneBoundary>
          ) : null}
        </div>

        <div
          className={cn(
            "absolute inset-0 z-[1] transition-opacity duration-500",
            sceneVisible ? "pointer-events-none opacity-0" : "opacity-100",
          )}
          aria-hidden={sceneVisible}
        >
          <PhoneShowcaseFallback activeIndex={activeIndex} />
        </div>
      </div>

      <div className="relative z-20 shrink-0 border-t border-cream-100/12 px-3 pb-2.5 pt-3 sm:px-5">
        <div className="flex items-end justify-between gap-2.5">
          <div className="min-w-0">
            <p className="font-data text-[12px] uppercase tracking-[0.08em] text-cream-100/58">
              {String(activeIndex + 1).padStart(2, "0")} / {String(SHOWCASE_TEMPLATES.length).padStart(2, "0")}
              <span className="mx-1.5 text-peach-300/50">·</span>
              {active.category}
            </p>
            <p className="mt-0.5 truncate font-display text-[clamp(1.15rem,2.4vw,1.55rem)] leading-none tracking-[-0.025em] text-cream-50">
              {active.name}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              to={`/demo/${active.slug}`}
              aria-label={`${t("portfolio.viewDemo")}: ${active.name}`}
              className="group/link inline-flex h-9 items-center gap-1.5 bg-peach-300 px-2.5 text-[13px] font-semibold text-ink-950 transition-colors hover:bg-peach-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300"
            >
              {t("portfolio.viewDemo")}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
            </Link>

            <div role="group" aria-label="Navigasi template" className="flex items-center">
              <button
                type="button"
                onClick={() => select(activeIndex - 1)}
                aria-label={`${t("common.prev")}: ${previous.name}`}
                className="flex h-9 w-9 items-center justify-center border border-cream-100/20 text-cream-100 transition-colors hover:border-peach-300 hover:text-peach-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => select(activeIndex + 1)}
                aria-label={`${t("common.next")}: ${next.name}`}
                className="flex h-9 w-9 items-center justify-center border border-l-0 border-cream-100/20 text-cream-100 transition-colors hover:border-peach-300 hover:text-peach-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center">
          <div role="group" aria-label="Pilih template" className="flex items-center">
            {SHOWCASE_TEMPLATES.map((template, index) => (
              <button
                key={template.slug}
                type="button"
                onClick={() => select(index)}
                aria-label={`Tampilkan ${template.name}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className="flex h-6 w-6 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-peach-300"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-[width,background-color] duration-300",
                    index === activeIndex ? "w-5 bg-peach-300" : "w-1.5 bg-cream-100/28",
                  )}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </div>
  );
}
