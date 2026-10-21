import { Canvas } from "@react-three/fiber";
import { HeartPrism, OrbitRing } from "./HeartMesh";

export default function HeroScene({ onContextLost }: { onContextLost?: () => void }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 9.2], fov: 36 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (event) => {
          event.preventDefault();
          onContextLost?.();
        });
      }}
    >
      <ambientLight intensity={0.95} color="#ffe7cf" />
      <directionalLight position={[4, 5, 4]} intensity={2.1} color="#fff1db" />
      <directionalLight position={[-5, -3, 1]} intensity={0.9} color="#d87844" />
      <pointLight position={[0, 0, 3.5]} intensity={8} distance={9} color="#ffd6b2" />
      <group scale={0.86} position={[0, 0.08, 0]} rotation={[0.08, -0.18, 0]}>
        <HeartPrism />
        <OrbitRing />
      </group>
    </Canvas>
  );
}
