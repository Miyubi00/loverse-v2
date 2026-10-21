import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { Float, Sparkles } from "@react-three/drei";
import { useHeartGeometry } from "./heartGeometry";


export function HeartPrism({ intensity = 1 }: { intensity?: number }) {
  const geometry = useHeartGeometry();
  const group = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    const targetY = state.pointer.x * 0.35;
    const targetX = -state.pointer.y * 0.22;
    group.current.rotation.y += (targetY - group.current.rotation.y) * Math.min(1, delta * 2.4);
    group.current.rotation.x += (targetX - group.current.rotation.x) * Math.min(1, delta * 2.4);
  });

  return (
    <group ref={group}>
      <Float speed={1.1} rotationIntensity={0.25} floatIntensity={0.6}>
        <mesh geometry={geometry} castShadow>
          <meshPhysicalMaterial
            color="#ffd6b2"
            roughness={0.26}
            metalness={0.04}
            clearcoat={1}
            clearcoatRoughness={0.2}
            emissive="#9e4319"
            emissiveIntensity={0.1 * intensity}
          />
        </mesh>
        <mesh geometry={geometry} scale={1.035}>
          <meshBasicMaterial color="#ffe9d3" wireframe transparent opacity={0.12} />
        </mesh>
      </Float>
      <Sparkles
        count={32}
        scale={[7, 6, 5]}
        size={1.4}
        speed={0.24}
        opacity={0.55}
        color="#ffd6b2"
        noise={0.6}
      />
    </group>
  );
}

export function OrbitRing() {
  const ring = useRef<Group>(null);
  useFrame((_, delta) => {
    if (ring.current) ring.current.rotation.z += delta * 0.06;
  });
  return (
    <group ref={ring} rotation={[1.32, 0.18, 0]}>
      <mesh>
        <torusGeometry args={[3.25, 0.012, 8, 160]} />
        <meshBasicMaterial color="#ffd6b2" transparent opacity={0.45} />
      </mesh>
      <mesh rotation={[0.35, 0.2, 0.4]}>
        <torusGeometry args={[3.8, 0.008, 8, 160]} />
        <meshBasicMaterial color="#f3bb8b" transparent opacity={0.28} />
      </mesh>
      <mesh position={[3.25, 0, 0]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color="#ffe3c9" />
      </mesh>
    </group>
  );
}
