import { useEffect, useState } from "react";

interface Capability {
  ready: boolean;
  canRender3D: boolean;
  reducedMotion: boolean;
}

function supportsWebGL() {
  if (!("WebGLRenderingContext" in window)) return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function readCapability(): { canRender3D: boolean; reducedMotion: boolean } {
  if (typeof window === "undefined") return { canRender3D: false, reducedMotion: false };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
  };
  const memory = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 8;
  const saveData = nav.connection?.saveData === true;
  const slowNetwork = /(^|-)2g$/.test(nav.connection?.effectiveType ?? "");
  return {
    reducedMotion,
    canRender3D:
      !reducedMotion && !saveData && !slowNetwork && memory >= 3 && cores >= 4 && supportsWebGL(),
  };
}

export default function useDeviceCapability(): Capability {
  const [state, setState] = useState<Capability>({
    ready: false,
    canRender3D: false,
    reducedMotion: false,
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => setState({ ready: true, ...readCapability() }));
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setState({ ready: true, ...readCapability() });
    media.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener("change", onChange);
    };
  }, []);

  return state;
}
