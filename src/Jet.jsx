import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function Jet({ isCrashed, multiplier, gameState }) {
  const meshRef = useRef();
  const propRef = useRef();
  const { viewport } = useThree();

  useFrame(() => {
    if (!meshRef.current) return;

    const leftEdge = -viewport.width / 2 + 1.2;
    const bottomEdge = -viewport.height / 2 + 1.8;

    // Propeller always spins if not crashed
    if (propRef.current && !isCrashed) {
      propRef.current.rotation.x += 0.8;
    }

    // Reset position if waiting for a new round
    if (gameState === "WAITING") {
      meshRef.current.position.set(leftEdge, bottomEdge, 0);
      meshRef.current.rotation.z = 0;
      return;
    }

    if (!isCrashed && gameState === "FLYING") {
      // THE SYNCED MATH: Matches the backend growth curve
      const fastFactor = Math.pow(multiplier - 1, 1.2);

      const targetX = leftEdge + Math.min(fastFactor * 1.8, viewport.width * 0.75);
      const targetY = Math.min(bottomEdge + fastFactor * 0.6, viewport.height / 2 - 2.2);

      // LERPING: This creates smooth motion between socket ticks
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.1);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
      
      // Rotate the nose up as it climbs
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z, 
        Math.min(fastFactor * 0.15, 0.45), 
        0.1
      );
    }

    // If crashed, the plane "stops" or you could add a falling animation here
    if (isCrashed) {
       meshRef.current.rotation.z -= 0.01; // Slight dip on crash
    }
  });

  return (
    <group ref={meshRef}>
      {/* Fuselage */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.2, 0.6, 4, 12]} />
        <meshStandardMaterial color="#ff0022" emissive="#330000" />
      </mesh>
      
      {/* Wing */}
      <mesh position={[0.1, 0.18, 0]}>
        <boxGeometry args={[0.4, 0.04, 2.2]} />
        <meshStandardMaterial color="#ff0022" />
      </mesh>

      {/* Propeller Hub & Blades */}
      <mesh position={[0.45, 0, 0]}><sphereGeometry args={[0.12, 16]} /><meshStandardMaterial color="#ff0022" /></mesh>
      <group ref={propRef} position={[0.5, 0, 0]}>
        <mesh><boxGeometry args={[0.02, 0.9, 0.08]} /><meshStandardMaterial color="#222" /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><boxGeometry args={[0.02, 0.9, 0.08]} /><meshStandardMaterial color="#222" /></mesh>
      </group>

      {/* Tail Fin */}
      <mesh position={[-0.4, 0.25, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.25, 0.4, 0.05]} />
        <meshStandardMaterial color="#ff0022" />
      </mesh>
    </group>
  );
}