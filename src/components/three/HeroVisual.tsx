import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import useDeviceCapability from "../../hooks/useDeviceCapability";
import HeroFallback from "./HeroFallback";

const HeroScene = lazy(() => import("./HeroScene"));

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export default function HeroVisual() {
  const { ready, canRender3D } = useDeviceCapability();
  const [mounted, setMounted] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    if (!ready || !canRender3D) return;
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => setMounted(true), { timeout: 1200 })
      : window.setTimeout(() => setMounted(true), 350);
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number);
      window.clearTimeout(idle as number);
    };
  }, [ready, canRender3D]);

  const fallback = (
    <div className="absolute inset-0">
      <HeroFallback />
    </div>
  );

  return (
    <div className="relative isolate h-full min-h-[320px] w-full" data-hero-visual="">
      <div className="pointer-events-none absolute inset-x-6 top-6 bottom-6 rounded-[50%] bg-[radial-gradient(ellipse,rgba(255,214,178,0.14),transparent_66%)]" />
      {!canRender3D || contextLost ? (
        fallback
      ) : (
        <div
          className={mounted ? "absolute inset-0 opacity-100 transition-opacity duration-700" : "absolute inset-0 opacity-0"}
          onContextMenu={(event) => event.preventDefault()}
        >
          <Suspense fallback={fallback}>
            <HeroScene onContextLost={() => setContextLost(true)} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
