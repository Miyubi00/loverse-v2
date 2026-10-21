import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useGLTF } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  CanvasTexture,
  Color,
  DoubleSide,
  LinearFilter,
  LinearMipmapLinearFilter,
  MathUtils,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  SRGBColorSpace,
  TextureLoader,
  type Group,
  type Mesh,
  type Texture,
} from "three";
import { readColorToken } from "../../lib/cssColor";
import { SHOWCASE_TEMPLATES } from "../home/showcaseTemplates";

const COUNT = SHOWCASE_TEMPLATES.length;
const MODEL_PATH = "/models/phone.glb";
const SPIN_SECONDS = 0.7;
const DRAG_THRESHOLD = 0.18;
const VELOCITY_THRESHOLD = 0.85;

interface SceneProps {
  activeIndex: number;
  onIndexChange: (index: number) => void;
  paused: boolean;
  autoRotate: boolean;
  onInteractStart: () => void;
  onInteractEnd: () => void;
  onReady: () => void;
  onContextLost: () => void;
}

function normalizeIndex(value: number) {
  return ((value % COUNT) + COUNT) % COUNT;
}

function useShowcaseTextures(activeIndex: number) {
  const { gl } = useThree();
  const cacheRef = useRef(new Map<number, Texture>());
  const pendingRef = useRef(new Set<number>());
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const wanted = [
      (activeIndex - 1 + COUNT) % COUNT,
      activeIndex,
      (activeIndex + 1) % COUNT,
      (activeIndex + 2) % COUNT,
    ];
    let cancelled = false;

    for (const index of wanted) {
      if (cacheRef.current.has(index) || pendingRef.current.has(index)) continue;
      pendingRef.current.add(index);
      new TextureLoader().load(
        SHOWCASE_TEMPLATES[index].image,
        (texture) => {
          pendingRef.current.delete(index);
          texture.colorSpace = SRGBColorSpace;
          texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
          texture.generateMipmaps = true;
          texture.minFilter = LinearMipmapLinearFilter;
          texture.magFilter = LinearFilter;
          texture.needsUpdate = true;
          cacheRef.current.set(index, texture);
          if (!cancelled) setVersion((value) => value + 1);
        },
        undefined,
        () => pendingRef.current.delete(index),
      );
    }

    for (const [index, texture] of cacheRef.current) {
      if (wanted.includes(index)) continue;
      texture.dispose();
      cacheRef.current.delete(index);
    }

    return () => {
      cancelled = true;
    };
  }, [activeIndex, gl]);

  useEffect(
    () => () => {
      for (const texture of cacheRef.current.values()) texture.dispose();
      cacheRef.current.clear();
    },
    [],
  );

  return { textures: cacheRef.current, version };
}

function PhoneModel({
  screenMaterial,
  materials,
}: {
  screenMaterial: MeshBasicMaterial;
  materials: {
    frame: MeshPhysicalMaterial;
    border: MeshPhysicalMaterial;
    camera: MeshPhysicalMaterial;
    cameraRing: MeshPhysicalMaterial;
  };
}) {
  const { scene } = useGLTF(MODEL_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);

  useLayoutEffect(() => {
    model.traverse((object: Object3D) => {
      const mesh = object as Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const source = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const name = source?.name;

      if (name === "Screen") mesh.material = screenMaterial;
      else if (name === "ScreenBorder") mesh.material = materials.border;
      else if (name === "SelfieCam" || name === "BackCamera") mesh.material = materials.camera;
      else if (name === "BackCamBorder") mesh.material = materials.cameraRing;
      else mesh.material = materials.frame;
    });
  }, [materials, model, screenMaterial]);

  return <primitive object={model} />;
}

function useScreenMaterials(displayedIndex: number, textures: Map<number, Texture>, version: number) {
  const first = useMemo(
    () => new MeshBasicMaterial({ color: "#140d09", toneMapped: false }),
    [],
  );
  const second = useMemo(
    () => new MeshBasicMaterial({ color: "#140d09", toneMapped: false }),
    [],
  );

  useEffect(() => {
    const firstTexture = textures.get(displayedIndex);
    const secondTexture = textures.get((displayedIndex + 1) % COUNT);

    if (firstTexture) {
      first.map = firstTexture;
      first.color.set("#ffffff");
      first.needsUpdate = true;
    }
    if (secondTexture) {
      second.map = secondTexture;
      second.color.set("#ffffff");
      second.needsUpdate = true;
    }
  }, [displayedIndex, first, second, textures, version]);

  useEffect(
    () => () => {
      first.dispose();
      second.dispose();
    },
    [first, second],
  );

  return [first, second] as const;
}

function OrbitDot({
  color,
  radius,
  flatten,
  speed,
  phase,
  glow,
}: {
  color: string;
  radius: number;
  flatten: number;
  speed: number;
  phase: number;
  glow: Texture;
}) {
  const dot = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!dot.current) return;
    const angle = phase + clock.elapsedTime * speed;
    dot.current.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * flatten, 0);
  });

  return (
    <group ref={dot}>
      <mesh>
        <sphereGeometry args={[0.018, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <sprite scale={[0.23, 0.23, 1]}>
        <spriteMaterial
          map={glow}
          color={color}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </sprite>
    </group>
  );
}

function OrbitRings({ orbitColor }: { orbitColor: { peach: string; ember: string } }) {
  const glow = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d");
    if (context) {
      const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255,255,255,0.95)");
      gradient.addColorStop(0.18, "rgba(255,255,255,0.6)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, 64, 64);
    }
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, []);

  useEffect(() => () => glow.dispose(), [glow]);

  const rings = useMemo(
    () => [
      {
        radius: 2.82,
        flatten: 0.5,
        position: [0, 0.2, -1.05] as const,
        rotation: [0.12, 0, 0.2] as const,
        opacity: 0.32,
        color: orbitColor.peach,
        speed: 0.11,
        phase: 0.4,
      },
      {
        radius: 3.18,
        flatten: 0.38,
        position: [0.08, -0.04, -1.5] as const,
        rotation: [0.66, 0.1, -0.18] as const,
        opacity: 0.16,
        color: orbitColor.ember,
        speed: -0.07,
        phase: 2.4,
      },
      {
        radius: 2.4,
        flatten: 0.3,
        position: [-0.08, -1.18, 1.3] as const,
        rotation: [0.38, -0.1, 0.12] as const,
        opacity: 0.2,
        color: orbitColor.peach,
        speed: 0.09,
        phase: 4.1,
      },
    ],
    [orbitColor.ember, orbitColor.peach],
  );

  return (
    <group>
      {rings.map((ring, index) => (
        <group
          key={index}
          position={[ring.position[0], ring.position[1], ring.position[2]]}
          rotation={[ring.rotation[0], ring.rotation[1], ring.rotation[2]]}
        >
          <mesh scale={[ring.radius, ring.radius * ring.flatten, 1]}>
            <torusGeometry args={[1, 0.0028, 3, 240]} />
            <meshBasicMaterial
              color={ring.color}
              transparent
              opacity={ring.opacity}
              side={DoubleSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
          <OrbitDot
            color={ring.color}
            radius={ring.radius}
            flatten={ring.flatten}
            speed={ring.speed}
            phase={ring.phase}
            glow={glow}
          />
          {index === 0 ? (
            <OrbitDot
              color={ring.color}
              radius={ring.radius}
              flatten={ring.flatten}
              speed={ring.speed}
              phase={ring.phase + Math.PI}
              glow={glow}
            />
          ) : null}
        </group>
      ))}
    </group>
  );
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function PhoneRig({
  activeIndex,
  onIndexChange,
  autoRotate,
  onInteractStart,
  onInteractEnd,
  onReady,
}: Omit<SceneProps, "paused" | "onContextLost">) {
  const { gl, size } = useThree();
  const pair = useRef<Group>(null);
  const frontFloat = useRef<Group>(null);
  const backFloat = useRef<Group>(null);
  const frontSpin = useRef<Group>(null);
  const turn = useRef(0);
  const dragOffset = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const pointerTarget = useRef({ x: 0, y: 0 });
  const spin = useRef({ from: 0, to: 0, startedAt: 0, active: false, targetIndex: activeIndex, swapped: false });
  const pendingDirection = useRef<-1 | 0 | 1>(0);
  const stateActiveRef = useRef(false);
  const activeIndexRef = useRef(activeIndex);
  const onIndexChangeRef = useRef(onIndexChange);
  const interactionStartRef = useRef(onInteractStart);
  const interactionEndRef = useRef(onInteractEnd);
  const [displayedIndex, setDisplayedIndex] = useState(activeIndex);
  const { textures, version } = useShowcaseTextures(activeIndex);
  const [frontScreen, backScreen] = useScreenMaterials(displayedIndex, textures, version);

  const colors = useMemo(
    () => ({
      peach: readColorToken("peach-300", "#ffd6b2"),
      ember: readColorToken("ember-500", "#bf7523"),
      cream: readColorToken("cream-100", "#ffefe2"),
      frame: new Color(readColorToken("cream-300", "#ecd0b8"))
        .lerp(new Color(readColorToken("ink-400", "#7d6958")), 0.62)
        .getStyle(),
      border: readColorToken("ink-950", "#190f07"),
      camera: readColorToken("ink-900", "#281b10"),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      frame: new MeshPhysicalMaterial({
        color: colors.frame,
        metalness: 0.86,
        roughness: 0.3,
        clearcoat: 0.55,
        clearcoatRoughness: 0.22,
        envMapIntensity: 1.45,
      }),
      border: new MeshPhysicalMaterial({
        color: colors.border,
        metalness: 0.35,
        roughness: 0.2,
        clearcoat: 0.6,
        clearcoatRoughness: 0.16,
        envMapIntensity: 1.1,
      }),
      camera: new MeshPhysicalMaterial({
        color: colors.camera,
        metalness: 0.15,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        envMapIntensity: 1.3,
      }),
      cameraRing: new MeshPhysicalMaterial({
        color: colors.frame,
        metalness: 0.9,
        roughness: 0.24,
        envMapIntensity: 1.4,
      }),
    }),
    [colors],
  );

  useEffect(
    () => () => {
      materials.frame.dispose();
      materials.border.dispose();
      materials.camera.dispose();
      materials.cameraRing.dispose();
    },
    [materials],
  );

  useEffect(() => {
    activeIndexRef.current = activeIndex;
    onIndexChangeRef.current = onIndexChange;
    interactionStartRef.current = onInteractStart;
    interactionEndRef.current = onInteractEnd;
  }, [activeIndex, onIndexChange, onInteractEnd, onInteractStart]);

  useEffect(() => {
    if (activeIndex === spin.current.targetIndex && !spin.current.active) return;

    let delta = activeIndex - spin.current.targetIndex;
    if (delta > COUNT / 2) delta -= COUNT;
    if (delta < -COUNT / 2) delta += COUNT;
    const step = pendingDirection.current || (Math.sign(delta) as -1 | 0 | 1) || 1;
    pendingDirection.current = 0;
    spin.current = {
      from: turn.current,
      to: turn.current - step * Math.PI * 2,
      startedAt: performance.now() / 1000,
      active: true,
      targetIndex: activeIndex,
      swapped: false,
    };
  }, [activeIndex]);

  useEffect(() => {
    if (!textures.get(displayedIndex) || !textures.get((displayedIndex + 1) % COUNT)) return;
    const frame = requestAnimationFrame(onReady);
    return () => cancelAnimationFrame(frame);
  }, [displayedIndex, onReady, textures, version]);

  useEffect(() => {
    const element = gl.domElement;
    const state = { active: false, pointerId: null as number | null, lastX: 0, lastY: 0, lastTime: 0, velocity: 0 };

    const endDrag = (cancelled: boolean) => {
      if (!state.active) return;
      state.active = false;
      stateActiveRef.current = false;
      element.style.cursor = "grab";
      if (state.pointerId !== null && element.hasPointerCapture(state.pointerId)) {
        element.releasePointerCapture(state.pointerId);
      }
      state.pointerId = null;
      interactionEndRef.current();

      if (cancelled) {
        dragOffset.current = 0;
        return;
      }

      const step =
        dragOffset.current < -DRAG_THRESHOLD || state.velocity < -VELOCITY_THRESHOLD
          ? 1
          : dragOffset.current > DRAG_THRESHOLD || state.velocity > VELOCITY_THRESHOLD
            ? -1
            : 0;

      if (step !== 0) {
        pendingDirection.current = step;
        onIndexChangeRef.current(normalizeIndex(activeIndexRef.current + step));
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (spin.current.active) return;
      state.active = true;
      state.pointerId = event.pointerId;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastTime = performance.now();
      state.velocity = 0;
      stateActiveRef.current = true;
      element.style.cursor = "grabbing";
      interactionStartRef.current();
      try {
        element.setPointerCapture(event.pointerId);
      } catch {
        state.pointerId = null;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = element.getBoundingClientRect();
      pointerTarget.current.x = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
      pointerTarget.current.y = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));

      if (!state.active) return;
      const now = performance.now();
      const elapsed = Math.max(0.001, (now - state.lastTime) / 1000);
      const dx = event.clientX - state.lastX;
      dragOffset.current = MathUtils.clamp(dragOffset.current + dx * 0.007, -0.72, 0.72);
      state.velocity = MathUtils.clamp(dx * 0.007 / elapsed, -4, 4);
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastTime = now;
    };

    const onPointerUp = () => endDrag(false);
    const onPointerCancel = () => endDrag(true);
    const onPointerLeave = () => {
      if (state.active) return;
      pointerTarget.current.x = 0;
      pointerTarget.current.y = 0;
      element.style.cursor = "grab";
    };

    element.style.cursor = "grab";
    element.addEventListener("pointerdown", onPointerDown);
    element.addEventListener("pointermove", onPointerMove);
    element.addEventListener("pointerup", onPointerUp);
    element.addEventListener("pointercancel", onPointerCancel);
    element.addEventListener("pointerleave", onPointerLeave);
    element.addEventListener("lostpointercapture", onPointerCancel);

    return () => {
      element.removeEventListener("pointerdown", onPointerDown);
      element.removeEventListener("pointermove", onPointerMove);
      element.removeEventListener("pointerup", onPointerUp);
      element.removeEventListener("pointercancel", onPointerCancel);
      element.removeEventListener("pointerleave", onPointerLeave);
      element.removeEventListener("lostpointercapture", onPointerCancel);
    };
  }, [gl]);

  useFrame(({ clock }, rawDelta) => {
    const delta = Math.min(0.05, rawDelta);
    const time = clock.elapsedTime;

    if (spin.current.active) {
      const progress = Math.min(1, (performance.now() / 1000 - spin.current.startedAt) / SPIN_SECONDS);
      const eased = easeInOutCubic(progress);
      turn.current = MathUtils.lerp(spin.current.from, spin.current.to, eased);
      if (!spin.current.swapped && progress >= 0.5) {
        spin.current.swapped = true;
        setDisplayedIndex(spin.current.targetIndex);
      }
      if (progress >= 1) {
        turn.current = spin.current.to;
        spin.current.active = false;
        setDisplayedIndex(spin.current.targetIndex);
      }
    }

    if (!stateActiveRef.current) {
      dragOffset.current = MathUtils.damp(dragOffset.current, 0, 7, delta);
    }

    pointer.current.x = MathUtils.damp(pointer.current.x, pointerTarget.current.x, 4, delta);
    pointer.current.y = MathUtils.damp(pointer.current.y, pointerTarget.current.y, 4, delta);

    if (pair.current) {
      const idleYaw = autoRotate ? Math.sin(time * 0.27) * 0.14 : Math.sin(time * 0.16) * 0.035;
      pair.current.rotation.y = MathUtils.damp(pair.current.rotation.y, idleYaw + dragOffset.current, 5, delta);
      pair.current.rotation.x = MathUtils.damp(pair.current.rotation.x, pointer.current.y * -0.025, 3.5, delta);
      pair.current.rotation.z = MathUtils.damp(pair.current.rotation.z, pointer.current.x * 0.018, 3.5, delta);
      pair.current.position.y = 0.06 + Math.sin(time * 0.62) * 0.035;
    }

    if (frontSpin.current) frontSpin.current.rotation.y = turn.current;
    if (frontFloat.current) {
      frontFloat.current.position.y = Math.sin(time * 0.86) * 0.026;
      frontFloat.current.rotation.z = Math.sin(time * 0.48) * 0.008;
    }
    if (backFloat.current) {
      backFloat.current.position.y = Math.sin(time * 0.68 + 1.7) * 0.034;
      backFloat.current.rotation.z = Math.sin(time * 0.4 + 0.8) * 0.006;
    }
  });

  const fitScale = Math.min(1.12, Math.max(0.86, (size.width / size.height) * 0.94));

  return (
    <>
      <ambientLight intensity={0.3} color={colors.cream} />
      <directionalLight position={[4.5, 6, 6.5]} intensity={1.35} color="#ffe2c9" />
      <directionalLight position={[-5, 2.5, 4]} intensity={0.55} color="#e6a775" />
      <directionalLight position={[0, 1.5, -5]} intensity={1.4} color="#ffd0a1" />
      <pointLight position={[0, -2.8, 4.5]} intensity={3.6} distance={11} color={colors.peach} />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color="#ffe1c6" scale={[7, 9, 1]} position={[-4, 3, 4]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.25} color="#ffd6b2" scale={[4, 8, 1]} position={[4.5, 1, 3.5]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.6} color="#f3b47e" scale={3.8} position={[0, -2.5, -3.5]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.7} color="#fff4e8" scale={[3, 3, 1]} position={[0, 5, 0]} target={[0, 0, 0]} />
      </Environment>

      <group scale={fitScale} position={[0, 0.08, 0]}>
        <OrbitRings orbitColor={{ peach: colors.peach, ember: colors.ember }} />

        <group ref={pair}>
          <group
            position={[-0.58, -0.18, -0.54]}
            rotation={[0.025, 0.3, 0.14]}
            scale={0.94}
          >
            <group ref={backFloat}>
              <PhoneModel screenMaterial={backScreen} materials={materials} />
            </group>
          </group>

          <group
            position={[0.64, -0.02, 0.54]}
            rotation={[0.03, -0.24, -0.105]}
            scale={1.06}
          >
            <group ref={frontSpin}>
              <group ref={frontFloat}>
                <PhoneModel screenMaterial={frontScreen} materials={materials} />
              </group>
            </group>
          </group>
        </group>

        <ContactShadows
          position={[0, -2.22, 0]}
          opacity={0.44}
          scale={7.5}
          blur={2.7}
          far={4.3}
          resolution={256}
          frames={1}
          color="#0b0603"
        />
      </group>
    </>
  );
}

export default function PhoneShowcaseScene({
  activeIndex,
  onIndexChange,
  paused,
  autoRotate,
  onInteractStart,
  onInteractEnd,
  onReady,
  onContextLost,
}: SceneProps) {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  return (
    <Canvas
      frameloop={paused ? "never" : "always"}
      dpr={[1, isMobile ? 1.5 : 2]}
      camera={{ position: [0, 0.05, 9.8], fov: 30, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
      aria-hidden="true"
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.06;
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onContextLost();
        });
      }}
    >
      <Suspense fallback={null}>
        <PhoneRig
          activeIndex={activeIndex}
          onIndexChange={onIndexChange}
          autoRotate={autoRotate}
          onInteractStart={onInteractStart}
          onInteractEnd={onInteractEnd}
          onReady={onReady}
        />
      </Suspense>
    </Canvas>
  );
}
