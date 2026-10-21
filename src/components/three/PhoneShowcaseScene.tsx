import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, useGLTF } from "@react-three/drei";
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  Box3,
  BufferGeometry,
  CanvasTexture,
  Color,
  DoubleSide,
  Group,
  LinearFilter,
  LinearMipmapLinearFilter,
  MathUtils,
  Matrix3,
  Matrix4,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  Object3D,
  Quaternion,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  type Material,
  type Mesh,
  type Texture,
} from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { readColorToken } from "../../lib/cssColor";
import type { PhoneShowcaseMotion } from "../home/phoneShowcaseMotion";
import { SHOWCASE_TEMPLATES } from "../home/showcaseTemplates";

const MODEL_PATH = "/models/phone.glb";
const PHONE_HEIGHT = 3.82;

interface SceneProps {
  activeIndex: number;
  motionRef: RefObject<PhoneShowcaseMotion>;
  onThemeChange: (index: number) => void;
  onTransitionComplete: () => void;
  onReady: () => void;
  onContextLost: () => void;
}

interface PhoneMaterials {
  frame: MeshPhysicalMaterial;
  bezel: MeshPhysicalMaterial;
  camera: MeshPhysicalMaterial;
  cameraRing: MeshPhysicalMaterial;
}

function materialList(mesh: Mesh): Material[] {
  return Array.isArray(mesh.material) ? mesh.material : [mesh.material];
}

function materialKey(material: Material) {
  return material.name.toLowerCase().replace(/[^a-z]/g, "");
}

function isDisplayMaterial(material: Material) {
  return materialKey(material) === "screen";
}

function classifyMaterial(name: string): keyof PhoneMaterials {
  const key = name.toLowerCase().replace(/[^a-z]/g, "");

  if (key.includes("backcamborder") || key.includes("lensring")) return "cameraRing";
  if (key.includes("screenborder") || key.includes("bezel")) return "bezel";
  if (key.includes("selfiecam") || key.includes("backcamera") || key.includes("lens")) {
    return "camera";
  }
  if (key.includes("case") || key.includes("frame") || key.includes("body") || key.includes("housing")) {
    return "frame";
  }
  return "frame";
}

function worldCenter(object: Object3D) {
  return new Box3().setFromObject(object).getCenter(new Vector3());
}

function averageScreenNormal(mesh: Mesh) {
  const normals = mesh.geometry.getAttribute("normal");
  const normalMatrix = new Matrix3().getNormalMatrix(mesh.matrixWorld);
  const average = new Vector3();

  for (let index = 0; index < normals.count; index += 1) {
    average.add(
      new Vector3()
        .fromBufferAttribute(normals, index)
        .applyMatrix3(normalMatrix)
        .normalize(),
    );
  }

  return average.lengthSq() > 0.0001 ? average.normalize() : new Vector3(0, 0, 1);
}

function screenLongAxis(mesh: Mesh, normal: Vector3, camera: Mesh | undefined) {
  mesh.geometry.computeBoundingBox();
  const bounds = mesh.geometry.boundingBox;
  const size = bounds?.getSize(new Vector3()) ?? new Vector3(1, 1, 0);
  const candidates = [
    { axis: new Vector3(1, 0, 0), extent: size.x },
    { axis: new Vector3(0, 1, 0), extent: size.y },
    { axis: new Vector3(0, 0, 1), extent: size.z },
  ]
    .map(({ axis, extent }) => {
      const worldAxis = axis.transformDirection(mesh.matrixWorld);
      worldAxis.addScaledVector(normal, -worldAxis.dot(normal));
      return { axis: worldAxis, score: extent * worldAxis.length() };
    })
    .filter(({ axis }) => axis.lengthSq() > 0.01)
    .sort((first, second) => second.score - first.score);

  const up = candidates[0]?.axis.normalize() ?? new Vector3(0, 1, 0);
  if (camera) {
    const screenCenter = worldCenter(mesh);
    const cameraDirection = worldCenter(camera).sub(screenCenter);
    cameraDirection.addScaledVector(normal, -cameraDirection.dot(normal));
    if (cameraDirection.lengthSq() > 0.01 && up.dot(cameraDirection) < 0) up.negate();
  } else if (up.y < 0) {
    up.negate();
  }
  return up.normalize();
}

function normalizePhone(root: Object3D) {
  root.updateMatrixWorld(true);
  let screenMesh: Mesh | undefined;
  let selfieCamera: Mesh | undefined;

  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const names = materialList(mesh).map(materialKey);
    if (names.some((name) => name === "screen")) screenMesh = mesh;
    if (names.some((name) => name.includes("selfiecam") || name.includes("frontcamera"))) {
      selfieCamera = mesh;
    }
  });

  const screenNormal = screenMesh ? averageScreenNormal(screenMesh) : new Vector3(0, 0, 1);
  const up = screenMesh
    ? screenLongAxis(screenMesh, screenNormal, selfieCamera)
    : new Vector3(0, 1, 0);
  const right = up.clone().cross(screenNormal).normalize();
  const sourceBasis = new Matrix4().makeBasis(right, up, screenNormal);
  const correction = new Quaternion().setFromRotationMatrix(sourceBasis).invert();
  root.applyQuaternion(correction);
  root.updateMatrixWorld(true);

  const bounds = new Box3().setFromObject(root);
  const center = bounds.getCenter(new Vector3());
  const dimensions = bounds.getSize(new Vector3());
  const scale = PHONE_HEIGHT / Math.max(dimensions.y, 0.001);
  root.scale.setScalar(scale);
  root.position.copy(center.multiplyScalar(-scale));
  root.updateMatrixWorld(true);
}

function moveWorldZ(object: Object3D, deltaZ: number) {
  if (!object.parent) return;
  const parentInverse = object.parent.matrixWorld.clone().invert();
  const localOrigin = new Vector3().applyMatrix4(parentInverse);
  const localTarget = new Vector3(0, 0, deltaZ).applyMatrix4(parentInverse);
  object.position.add(localTarget.sub(localOrigin));
}

function placeRearCamerasOnBack(root: Object3D) {
  root.updateMatrixWorld(true);
  const phoneBounds = new Box3().setFromObject(root);
  const rearParts: Mesh[] = [];
  const cameraBounds = new Box3();

  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;
    const keys = materialList(mesh).map(materialKey);
    if (!keys.some((key) => key.includes("backcamera") || key.includes("backcamborder"))) return;
    rearParts.push(mesh);
    cameraBounds.union(new Box3().setFromObject(mesh));
  });

  if (rearParts.length === 0 || cameraBounds.isEmpty()) return;

  const cameraCenter = cameraBounds.getCenter(new Vector3());
  const cameraDepth = cameraBounds.getSize(new Vector3()).z;
  const targetCenterZ = phoneBounds.min.z - Math.min(cameraDepth * 0.35, 0.025);
  const deltaZ = targetCenterZ - cameraCenter.z;
  rearParts.forEach((mesh) => moveWorldZ(mesh, deltaZ));
  root.updateMatrixWorld(true);
}

function makePhone(
  source: Object3D,
  screen: MeshBasicMaterial,
  materials: PhoneMaterials,
) {
  const model = source.clone(true);
  const geometries: BufferGeometry[] = [];
  normalizePhone(model);
  placeRearCamerasOnBack(model);

  model.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh) return;

    const sourceGeometry = mesh.geometry.clone();
    const creasedGeometry = toCreasedNormals(sourceGeometry, MathUtils.degToRad(48));
    if (creasedGeometry !== sourceGeometry) sourceGeometry.dispose();
    mesh.geometry = creasedGeometry;
    geometries.push(creasedGeometry);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const originals = materialList(mesh);
    const keys = originals.map(materialKey);
    if (keys.some((key) => key.includes("backcamera") || key.includes("backcamborder"))) {
      mesh.userData.rearCameraPart = true;
      mesh.visible = false;
    }
    const assigned = originals.map((original) =>
      isDisplayMaterial(original)
        ? screen
        : materials[classifyMaterial(original.name)],
    );
    mesh.material = Array.isArray(mesh.material) ? assigned : assigned[0];
  });

  return { model, geometries };
}

function PhoneModel({
  screen,
  materials,
}: {
  screen: MeshBasicMaterial;
  materials: PhoneMaterials;
}) {
  const { scene } = useGLTF(MODEL_PATH);
  const prepared = useMemo(() => makePhone(scene, screen, materials), [materials, scene, screen]);

  useEffect(
    () => () => {
      prepared.geometries.forEach((geometry) => geometry.dispose());
    },
    [prepared],
  );

  return <primitive object={prepared.model} />;
}

function OrbitGlow({ texture, color }: { texture: Texture; color: string }) {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.026, 12, 12]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <sprite scale={[0.24, 0.24, 1]}>
        <spriteMaterial
          map={texture}
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

function OrbitRings({ peach, ember }: { peach: string; ember: string }) {
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

  const rings = [
    { radius: 2.8, flatten: 0.56, position: [0, 0.02, -2.1] as const, rotation: [0.84, 0.08, 0.12] as const, color: peach, opacity: 0.33, dot: 0.52, arc: Math.PI * 2 },
    { radius: 3.18, flatten: 0.4, position: [0.05, -0.12, -2.4] as const, rotation: [0.48, -0.12, -0.17] as const, color: ember, opacity: 0.17, dot: 2.4, arc: Math.PI * 2 },
    { radius: 3.1, flatten: 0.34, position: [0, -0.6, 1.02] as const, rotation: [0.42, 0.2, -0.8] as const, color: peach, opacity: 0.21, dot: 0.8, arc: 1.4 },
  ];

  return (
    <group>
      {rings.map((ring, index) => {
        const angle = ring.dot;
        return (
          <group
            key={index}
            position={ring.position}
            rotation={ring.rotation}
          >
            <mesh scale={[ring.radius, ring.radius * ring.flatten, 1]}>
              <torusGeometry args={[1, 0.0028, 3, 240, ring.arc]} />
              <meshBasicMaterial
                color={ring.color}
                transparent
                opacity={ring.opacity}
                side={DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
            <group
              position={[
                Math.cos(angle) * ring.radius,
                Math.sin(angle) * ring.radius * ring.flatten,
                0,
              ]}
            >
              <OrbitGlow texture={glow} color={ring.color} />
            </group>
          </group>
        );
      })}
    </group>
  );
}

function ShowcaseRig({
  activeIndex,
  onReady,
  motionRef,
  onThemeChange,
  onTransitionComplete,
}: Pick<SceneProps, "activeIndex" | "motionRef" | "onReady" | "onThemeChange" | "onTransitionComplete">) {
  const { gl, invalidate } = useThree();
  const phoneStackRef = useRef<Group>(null);
  const animationRef = useRef({
    commandId: 0,
    active: false,
    direction: 0 as -1 | 0 | 1,
    from: 0,
    startedAt: 0,
    duration: 1,
    nextIndex: activeIndex,
    swapped: false,
  });
  useEffect(() => {
    const motion = motionRef.current;
    motion.requestFrame = invalidate;
    return () => {
      motion.requestFrame = undefined;
    };
  }, [invalidate, motionRef]);
  const nextIndex = (activeIndex + 1) % SHOWCASE_TEMPLATES.length;
  const textures = useLoader(
    TextureLoader,
    SHOWCASE_TEMPLATES.map((template) => template.image),
  );

  useFrame(() => {
    const group = phoneStackRef.current;
    if (!group) return;

    const motion = motionRef.current;
    const command = motion.command;
    const animation = animationRef.current;

    if (command && command.id !== animation.commandId) {
      animation.commandId = command.id;
      animation.active = true;
      animation.direction = command.direction;
      animation.from = motion.dragOffset;
      animation.startedAt = performance.now();
      animation.duration =
        command.direction === 0
          ? 0.24
          : Math.max(0.68, Math.min(1.28, 1.14 - command.velocity * 0.035));
      animation.nextIndex = command.nextIndex;
      animation.swapped = command.direction === 0;
    }

    if (motion.dragging) {
      group.position.x = motion.dragOffset;
      group.position.z = -Math.abs(motion.dragOffset) * 0.06;
      group.rotation.z = -motion.dragOffset * 0.075;
      group.scale.setScalar(1 - Math.abs(motion.dragOffset) * 0.035);
      invalidate();
      return;
    }

    if (!animation.active) return;

    const progress = Math.min(
      (performance.now() - animation.startedAt) / (animation.duration * 1000),
      1,
    );
    const eased =
      progress < 0.5
        ? 4 * progress ** 3
        : 1 - (-2 * progress + 2) ** 3 / 2;
    const cardArc = Math.sin(progress * Math.PI);
    group.position.x =
      animation.from * (1 - eased) - animation.direction * 0.58 * cardArc;
    group.position.z = -0.08 * cardArc;
    group.rotation.z =
      -animation.direction * 0.045 * cardArc - animation.from * 0.06 * (1 - eased);
    group.scale.setScalar(
      1 - 0.055 * cardArc - Math.abs(animation.from) * 0.035 * (1 - eased),
    );

    if (animation.direction !== 0 && !animation.swapped && progress >= 0.5) {
      animation.swapped = true;
      onThemeChange(animation.nextIndex);
    }

    if (progress >= 1) {
      group.position.set(0, 0, 0);
      group.rotation.set(0, 0, 0);
      group.scale.setScalar(1);
      animation.active = false;
      motion.dragOffset = 0;
      motion.command = null;
      onTransitionComplete();
    } else {
      invalidate();
    }
  });

  useLayoutEffect(() => {
    textures.forEach((texture) => {
      texture.colorSpace = SRGBColorSpace;
      texture.flipY = false;
      texture.repeat.x = -1;
      texture.offset.x = 1;
      texture.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
      texture.generateMipmaps = true;
      texture.minFilter = LinearMipmapLinearFilter;
      texture.magFilter = LinearFilter;
      texture.needsUpdate = true;
    });
  }, [gl, textures]);

  const screens = useMemo(
    () =>
      [textures[activeIndex], textures[nextIndex]].map(
        (texture) =>
          new MeshBasicMaterial({
            map: texture,
            color: "white",
            toneMapped: false,
          }),
      ),
    [activeIndex, nextIndex, textures],
  );

  useEffect(() => () => screens.forEach((material) => material.dispose()), [screens]);

  const colors = useMemo(
    () => ({
      peach: readColorToken("peach-300", "#ffd6b2"),
      ember: readColorToken("ember-500", "#bf7523"),
      cream: readColorToken("cream-100", "#ffefe2"),
      frame: new Color(readColorToken("cream-300", "#ecd0b8"))
        .lerp(new Color(readColorToken("ink-400", "#7d6958")), 0.48)
        .getStyle(),
      black: readColorToken("ink-950", "#190f07"),
    }),
    [],
  );

  const materials = useMemo(
    () => ({
      frame: new MeshPhysicalMaterial({
        color: colors.frame,
        metalness: 0.92,
        roughness: 0.27,
        clearcoat: 0.35,
        clearcoatRoughness: 0.2,
        envMapIntensity: 1.45,
      }),
      bezel: new MeshPhysicalMaterial({
        color: colors.black,
        metalness: 0.14,
        roughness: 0.19,
        clearcoat: 0.75,
        clearcoatRoughness: 0.1,
      }),
      camera: new MeshPhysicalMaterial({
        color: colors.black,
        metalness: 0.26,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      }),
      cameraRing: new MeshPhysicalMaterial({
        color: colors.frame,
        metalness: 0.94,
        roughness: 0.23,
      }),
    }),
    [colors],
  );

  useEffect(
    () => () => {
      materials.frame.dispose();
      materials.bezel.dispose();
      materials.camera.dispose();
      materials.cameraRing.dispose();
    },
    [materials],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(onReady);
    return () => cancelAnimationFrame(frame);
  }, [onReady]);

  return (
    <>
      <ambientLight intensity={0.34} color={colors.cream} />
      <directionalLight position={[4.5, 5.5, 6]} intensity={1.55} color={colors.cream} />
      <directionalLight position={[-5, 2.5, 4]} intensity={0.72} color={colors.ember} />
      <directionalLight position={[0, 1.5, -5]} intensity={1.65} color={colors.peach} />
      <pointLight position={[0, -2.7, 4]} intensity={2.8} distance={10} color={colors.peach} />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} color={colors.cream} scale={[7, 9, 1]} position={[-4, 3, 4]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.25} color={colors.peach} scale={[4, 8, 1]} position={[4.5, 1, 3.5]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.6} color={colors.ember} scale={3.8} position={[0, -2.5, -3.5]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.7} color={colors.cream} scale={[3, 3, 1]} position={[0, 5, 0]} target={[0, 0, 0]} />
      </Environment>

      <group>
        <OrbitRings peach={colors.peach} ember={colors.ember} />
        <group ref={phoneStackRef}>
          <group position={[-0.62, -0.16, -0.62]} rotation={[0.035, -0.14, 0.19]} scale={0.93}>
            <PhoneModel screen={screens[1]} materials={materials} />
          </group>
          <group position={[0.64, 0.04, 0.46]} rotation={[0.025, 0.16, -0.2]} scale={1.08}>
            <PhoneModel screen={screens[0]} materials={materials} />
          </group>
        </group>
        <ContactShadows
          position={[0, -2.18, 0]}
          opacity={0.42}
          scale={7}
          blur={2.6}
          far={4}
          resolution={256}
          frames={1}
          color={colors.black}
        />
      </group>
    </>
  );
}

export default function PhoneShowcaseScene({
  activeIndex,
  motionRef,
  onThemeChange,
  onTransitionComplete,
  onReady,
  onContextLost,
}: SceneProps) {
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  return (
  <Canvas
      frameloop="demand"
      dpr={[1, isMobile ? 1.5 : 2]}
      camera={{ position: [0, 0.05, 9.2], fov: 32, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = SRGBColorSpace;
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onContextLost();
        });
      }}
    >
      <Suspense fallback={null}>
        <ShowcaseRig
          activeIndex={activeIndex}
          motionRef={motionRef}
          onThemeChange={onThemeChange}
          onTransitionComplete={onTransitionComplete}
          onReady={onReady}
        />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_PATH);
