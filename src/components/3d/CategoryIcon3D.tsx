import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Float } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

interface CategoryIcon3DProps {
  color: string;
  emoji: string;
  size?: number;
}

const IconBox = ({ color }: { color: string }) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.5;
      ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <RoundedBox ref={ref} args={[1.5, 1.5, 1.5]} radius={0.3} smoothness={4}>
        <meshStandardMaterial
          color={color}
          metalness={0.25}
          roughness={0.2}
        />
      </RoundedBox>
    </Float>
  );
};

const CategoryIcon3D = ({ color, emoji, size = 48 }: CategoryIcon3DProps) => {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 5]} intensity={0.8} />
        <directionalLight position={[-2, 1, 3]} intensity={0.3} />
        <Suspense fallback={null}>
          <IconBox color={color} />
        </Suspense>
      </Canvas>
      {/* Emoji overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span style={{ fontSize: size * 0.4 }}>{emoji}</span>
      </div>
    </div>
  );
};

export default CategoryIcon3D;
