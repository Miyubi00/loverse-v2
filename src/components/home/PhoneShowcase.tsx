import {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import useDeviceCapability from "../../hooks/useDeviceCapability";
import { useTranslation } from "../../i18n";
import { cn } from "../../lib/cn";
import PhoneShowcaseFallback from "./PhoneShowcaseFallback";
import { SHOWCASE_TEMPLATES } from "./showcaseTemplates";
import type { PhoneShowcaseMotion } from "./phoneShowcaseMotion";

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

interface PointerState {
  pointerId: number | null;
  startX: number;
  lastX: number;
  lastTime: number;
  distanceX: number;
  velocity: number;
}

const wrapIndex = (index: number) =>
  (index + SHOWCASE_TEMPLATES.length) % SHOWCASE_TEMPLATES.length;

export default function PhoneShowcase() {
  const { t } = useTranslation();
  const { ready, canRender3D, reducedMotion } = useDeviceCapability();
  const rootRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<PhoneShowcaseMotion>({
    dragging: false,
    dragOffset: 0,
    commandId: 0,
    command: null,
  });
  const pointerRef = useRef<PointerState>({
    pointerId: null,
    startX: 0,
    lastX: 0,
    lastTime: 0,
    distanceX: 0,
    velocity: 0,
  });
  const activeIndexRef = useRef(0);
  const transitioningRef = useRef(false);
  const [inView, setInView] = useState(() => !("IntersectionObserver" in window));
  const [documentVisible, setDocumentVisible] = useState(
    () => document.visibilityState === "visible",
  );
  const [mounted, setMounted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const active = SHOWCASE_TEMPLATES[activeIndex];
  const sceneActive = mounted && canRender3D && !contextLost && inView && documentVisible;
  const sceneVisible = sceneActive && sceneReady;

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
  const onTransitionComplete = useCallback(() => {
    transitioningRef.current = false;
    setIsTransitioning(false);
  }, []);
  const changeTheme = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  }, []);

  const queueTransition = useCallback((direction: -1 | 1, velocity = 0) => {
    if (transitioningRef.current) return;

    const motion = motionRef.current;
    const nextIndex = wrapIndex(activeIndexRef.current + direction);
    if (!sceneVisible) {
      motion.dragging = false;
      motion.dragOffset = 0;
      changeTheme(nextIndex);
      return;
    }

    transitioningRef.current = true;
    setIsTransitioning(true);
    motion.dragging = false;
    motion.commandId += 1;
    motion.command = {
      id: motion.commandId,
      direction,
      nextIndex,
      velocity,
    };
    motion.requestFrame?.();
  }, [changeTheme, sceneVisible]);

  const queueSnapBack = useCallback(() => {
    const motion = motionRef.current;
    if (!sceneVisible) {
      motion.dragOffset = 0;
      motion.dragging = false;
      return;
    }
    if (Math.abs(motion.dragOffset) < 0.015) {
      motion.dragging = false;
      return;
    }
    transitioningRef.current = true;
    setIsTransitioning(true);
    motion.dragging = false;
    motion.commandId += 1;
    motion.command = {
      id: motion.commandId,
      direction: 0,
      nextIndex: activeIndexRef.current,
      velocity: 0,
    };
    motion.requestFrame?.();
  }, [sceneVisible]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || transitioningRef.current) return;
    if (event.target instanceof Element && event.target.closest("a, button, [data-carousel-control]")) {
      return;
    }

    const now = performance.now();
    pointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      lastTime: now,
      distanceX: 0,
      velocity: 0,
    };
    motionRef.current.dragging = true;
    motionRef.current.dragOffset = 0;
    motionRef.current.requestFrame?.();
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    if (pointer.pointerId !== event.pointerId) return;

    const now = performance.now();
    const elapsed = Math.max((now - pointer.lastTime) / 1000, 0.008);
    const width = Math.max(event.currentTarget.clientWidth, 1);
    const stepX = event.clientX - pointer.lastX;
    pointer.distanceX = event.clientX - pointer.startX;
    pointer.velocity = (-stepX / width) * Math.PI / elapsed;
    pointer.lastX = event.clientX;
    pointer.lastTime = now;
    motionRef.current.dragOffset = Math.max(
      -0.85,
      Math.min(0.85, (pointer.distanceX / width) * 1.2),
    );
    motionRef.current.requestFrame?.();
    if (Math.abs(pointer.distanceX) > 5) event.preventDefault();
  }, []);

  const finishPointer = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const pointer = pointerRef.current;
      if (pointer.pointerId !== event.pointerId) return;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      pointerRef.current.pointerId = null;
      setIsDragging(false);
      const shouldAdvance = Math.abs(pointer.distanceX) >= 38 || Math.abs(pointer.velocity) >= 1.4;
      if (shouldAdvance) {
        const direction =
          Math.abs(pointer.distanceX) >= 8
            ? pointer.distanceX < 0
              ? 1
              : -1
            : pointer.velocity < 0
              ? -1
              : 1;
        queueTransition(direction, Math.min(Math.abs(pointer.velocity), 12));
      } else {
        queueSnapBack();
      }
    },
    [queueSnapBack, queueTransition],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        queueTransition(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        queueTransition(-1);
      }
    },
    [queueTransition],
  );

  useEffect(() => {
    if (!isPlaying || reducedMotion || isTransitioning || !inView || !documentVisible) return;
    const timer = window.setTimeout(() => queueTransition(1), 6200);
    return () => window.clearTimeout(timer);
  }, [documentVisible, inView, isPlaying, isTransitioning, activeIndex, queueTransition, reducedMotion]);

  return (
    <div
      ref={rootRef}
      role="region"
      aria-label={t("home.showcaseRegion")}
      aria-roledescription={t("home.showcaseCarousel")}
      aria-keyshortcuts="ArrowLeft ArrowRight"
      tabIndex={0}
      data-index={activeIndex}
      data-showcase-index={activeIndex}
      data-showcase-mode={sceneVisible ? "webgl" : "fallback"}
      className="group relative flex h-full w-full select-none flex-col overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-peach-300/70"
      onKeyDown={onKeyDown}
    >
      <div
        className={cn(
          "relative min-h-0 flex-1 touch-pan-y overflow-hidden",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
      >
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
                  motionRef={motionRef}
                  onThemeChange={changeTheme}
                  onTransitionComplete={onTransitionComplete}
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
          <PhoneShowcaseFallback activeIndex={activeIndex} reducedMotion={reducedMotion} />
        </div>

        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 sm:bottom-4 sm:left-4">
          <button
            type="button"
            data-carousel-control=""
            aria-label={t("home.showcasePrevious")}
            disabled={isTransitioning}
            onClick={() => queueTransition(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream-100/25 bg-ink-950/75 text-cream-50 backdrop-blur transition-colors hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300 disabled:opacity-45"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-carousel-control=""
            aria-label={reducedMotion ? t("home.showcaseMotionDisabled") : isPlaying ? t("home.showcasePause") : t("home.showcasePlay")}
            aria-pressed={isPlaying && !reducedMotion}
            disabled={reducedMotion}
            onClick={() => setIsPlaying((playing) => !playing)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream-100/25 bg-ink-950/75 text-cream-50 backdrop-blur transition-colors hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            data-carousel-control=""
            aria-label={t("home.showcaseNext")}
            disabled={isTransitioning}
            onClick={() => queueTransition(1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-cream-100/25 bg-ink-950/75 text-cream-50 backdrop-blur transition-colors hover:bg-ink-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach-300 disabled:opacity-45"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
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
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {active.name}, {activeIndex + 1} {t("home.showcaseOf")} {SHOWCASE_TEMPLATES.length}
        </p>
      </div>
    </div>
  );
}
