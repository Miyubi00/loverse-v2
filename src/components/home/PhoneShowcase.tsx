import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import useDeviceCapability from "../../hooks/useDeviceCapability";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/cn";
import PhoneShowcaseFallback from "./PhoneShowcaseFallback";
import { SHOWCASE_TEMPLATES } from "./showcaseTemplates";

const PhoneShowcaseScene = lazy(() => import("../three/PhoneShowcaseScene"));

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
  const { ready, canRender3D } = useDeviceCapability();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(() => !("IntersectionObserver" in window));
  const [documentVisible, setDocumentVisible] = useState(
    () => document.visibilityState === "visible",
  );
  const [mounted, setMounted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const activeIndex = 0;
  const active = SHOWCASE_TEMPLATES[activeIndex];

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
    if (!ready || !canRender3D || !inView || !documentVisible) return;
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setMounted(true), { timeout: 1200 })
      : window.setTimeout(() => setMounted(true), 350);

    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number);
      window.clearTimeout(idle as number);
    };
  }, [ready, canRender3D, documentVisible, inView]);

  const onSceneReady = useCallback(() => setSceneReady(true), []);
  const onContextLost = useCallback(() => {
    setSceneReady(false);
    setContextLost(true);
  }, []);

  const sceneActive = mounted && canRender3D && !contextLost;
  const sceneVisible = sceneActive && sceneReady;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label="Pratinjau template undangan"
      data-index={activeIndex}
      data-showcase-index={activeIndex}
      data-showcase-mode={sceneVisible ? "webgl" : "fallback"}
      className="group relative flex h-full w-full select-none flex-col overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-peach-300/70"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse at 54% 44%, color-mix(in srgb, var(--color-peach-300) 17%, transparent), transparent 49%), radial-gradient(ellipse at 72% 82%, color-mix(in srgb, var(--color-ember-600) 15%, transparent), transparent 60%), radial-gradient(ellipse at center, transparent 40%, color-mix(in srgb, var(--color-ink-950) 82%, transparent) 100%)",
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
            <SceneBoundary onError={onContextLost}>
              <Suspense fallback={null}>
                <PhoneShowcaseScene
                  activeIndex={activeIndex}
                  onReady={onSceneReady}
                  onContextLost={onContextLost}
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
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="font-data text-[12px] uppercase tracking-[0.08em] text-cream-100/70">
              {String(activeIndex + 1).padStart(2, "0")} /{" "}
              {String(SHOWCASE_TEMPLATES.length).padStart(2, "0")}
              <span className="mx-1.5 text-peach-300/65">·</span>
              {active.category}
            </p>
            <p className="mt-1 truncate font-display text-[clamp(1.15rem,2.4vw,1.55rem)] leading-none tracking-[-0.025em] text-cream-50">
              {active.name}
            </p>
          </div>

          <Link
            to={"/demo/" + active.slug}
            aria-label={t("portfolio.viewDemo") + ": " + active.name}
            className="group/link inline-flex h-10 shrink-0 items-center gap-1.5 bg-peach-300 px-3 text-[13px] font-semibold text-ink-950 transition-colors hover:bg-peach-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300"
          >
            {t("portfolio.viewDemo")}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
