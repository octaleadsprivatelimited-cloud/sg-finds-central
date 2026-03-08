import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sphere } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

const FloatingSphere = ({ position, color, size, speed, distort }: {
  position: [number, number, number];
  color: string;
  size: number;
  speed: number;
  distort: number;
}) => {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * speed) * 0.3;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.6}>
      <Sphere ref={ref} args={[size, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={2}
          roughness={0.2}
          metalness={0.1}
        />
      </Sphere>
    </Float>
  );
};

const Buildings = () => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  const buildingData = [
    { pos: [-1.2, -0.3, 0] as [number, number, number], h: 1.8, w: 0.5, color: "#6366f1" },
    { pos: [-0.5, -0.1, 0.3] as [number, number, number], h: 2.4, w: 0.6, color: "#818cf8" },
    { pos: [0.2, 0, 0.1] as [number, number, number], h: 3, w: 0.7, color: "#6366f1" },
    { pos: [0.9, -0.2, 0.4] as [number, number, number], h: 2.0, w: 0.5, color: "#a78bfa" },
    { pos: [1.5, -0.4, -0.1] as [number, number, number], h: 1.5, w: 0.45, color: "#818cf8" },
  ];

  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {buildingData.map((b, i) => (
        <mesh key={i} position={[b.pos[0], b.pos[1] + b.h / 2, b.pos[2]]}>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshStandardMaterial
            color={b.color}
            metalness={0.4}
            roughness={0.15}
            transparent
            opacity={0.85}
          />
        </mesh>
      ))}
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, -0.5, 0.1]}>
        <circleGeometry args={[2.5, 32]} />
        <meshStandardMaterial color="#e0e7ff" transparent opacity={0.4} />
      </mesh>
    </group>
  );
};

const HeroScene = () => {
  return (
    <div className="w-full h-[200px] md:h-[280px]">
      <Canvas
        camera={{ position: [0, 2, 6], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-3, 2, 4]} intensity={0.4} color="#a78bfa" />
        <pointLight position={[0, 3, 2]} intensity={0.3} color="#6366f1" />
        <Suspense fallback={null}>
          <Buildings />
          <FloatingSphere position={[-2, 1.5, -1]} color="#f59e0b" size={0.25} speed={1.5} distort={0.3} />
          <FloatingSphere position={[2.2, 1.8, -0.5]} color="#10b981" size={0.2} speed={2} distort={0.4} />
          <FloatingSphere position={[0, 2.5, -1]} color="#ec4899" size={0.15} speed={1.8} distort={0.2} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default HeroScene;
