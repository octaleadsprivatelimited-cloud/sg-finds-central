import { Canvas, useFrame } from "@react-three/fiber";
import { RoundedBox, Float } from "@react-three/drei";
import { useRef, Suspense } from "react";
import * as THREE from "three";

const LogoBox = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.6;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.15;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <RoundedBox ref={meshRef} args={[1.4, 1.4, 1.4]} radius={0.25} smoothness={4}>
        <meshStandardMaterial
          color="#6366f1"
          metalness={0.3}
          roughness={0.2}
        />
      </RoundedBox>
      {/* Inner search icon represented as a torus */}
      <mesh position={[0, 0, 0.75]} rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[0.3, 0.08, 16, 32]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.3} />
      </mesh>
      <mesh position={[0.28, -0.28, 0.75]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.06, 0.06, 0.3, 8]} />
        <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.3} />
      </mesh>
    </Float>
  );
};

const Logo3D = ({ size = 36 }: { size?: number }) => {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 40 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 3, 5]} intensity={1} />
        <directionalLight position={[-2, -1, 3]} intensity={0.3} color="#a78bfa" />
        <Suspense fallback={null}>
          <LogoBox />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Logo3D;
