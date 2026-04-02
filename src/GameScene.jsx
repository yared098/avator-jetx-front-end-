import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo } from "react";
import Jet from "./Jet";

function FlightPath({ multiplier, gameState }) {
  const { viewport } = useThree();

  const points = useMemo(() => {
    const p = [];
    const leftEdge = -viewport.width / 2 + 1.2;
    const bottomEdge = -viewport.height / 2 + 1.8;

    // Draw the line points based on the current backend multiplier
    for (let i = 1; i <= multiplier; i += 0.05) {
      const fastFactor = Math.pow(i - 1, 1.2);
      const x = leftEdge + Math.min(fastFactor * 1.8, viewport.width * 0.75);
      const y = bottomEdge + fastFactor * 0.6;
      p.push(new THREE.Vector3(x, y, 0));
    }
    return p;
  }, [multiplier, viewport]);

  const lineGeometry = useMemo(() => 
    new THREE.BufferGeometry().setFromPoints(points), 
  [points]);

  const fillShape = useMemo(() => {
    const shape = new THREE.Shape();
    if (points.length < 2) return shape;

    const leftEdge = -viewport.width / 2 + 1.2;
    const bottomEdge = -viewport.height / 2 + 1.8;

    shape.moveTo(leftEdge, bottomEdge);
    points.forEach(p => shape.lineTo(p.x, p.y));
    shape.lineTo(points[points.length - 1].x, bottomEdge);
    shape.closePath();
    return shape;
  }, [points, viewport]);

  if (gameState === "WAITING" || points.length < 2) return null;

  return (
    <group>
      <line geometry={lineGeometry}>
        <lineBasicMaterial color="#1625aa" linewidth={2} />
      </line>
      <mesh position={[0, 0, -0.01]}>
        <shapeGeometry args={[fillShape]} />
        <meshBasicMaterial color="#207008" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function GameScene({ multiplier, isCrashed, gameState, showPath }) {
  return (
    <div className="w-full h-full">
      <Canvas 
        shadows
        className="bg-[#0f1011]" 
        camera={{ position: [0, 0, 10], fov: 45 }}
      >
        <ambientLight intensity={1.0} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
        
        {showPath && <FlightPath multiplier={multiplier} gameState={gameState} />}

        <Jet 
          multiplier={multiplier} 
          isCrashed={isCrashed} 
          gameState={gameState} 
        />

        <gridHelper 
          args={[100, 50, 0x333333, 0x111111]} 
          rotation={[Math.PI / 2, 0, 0]} 
          position={[0, 0, -0.1]} 
        />
      </Canvas>
    </div>
  );
}   
