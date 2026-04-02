import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

export function Jet({ isCrashed, multiplier }) {
  const meshRef = useRef();

  useFrame((state) => {
    if (!isCrashed) {
      const t = state.clock.getElapsedTime();
      // Up and down "bobbing" animation
      meshRef.current.position.y = Math.sin(t * 1.5) * 0.2;
      // Slight tilt forward as it "accelerates"
      meshRef.current.rotation.x = -Math.PI / 4 + (multiplier * 0.01);
    } else {
      // Falling animation if crashed
      meshRef.current.position.y -= 0.1;
      meshRef.current.rotation.z += 0.1;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[0, Math.PI / 2, 0]}>
      <coneGeometry args={[0.5, 2, 32]} />
      <meshStandardMaterial color={isCrashed ? "#ff4d4d" : "#00f2ff"} emissive={isCrashed ? "red" : "cyan"} />
    </mesh>
  );
}