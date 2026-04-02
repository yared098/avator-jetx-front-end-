function Sunrays() {
  return (
    <mesh position={[-10, -10, -2]} rotation={[0, 0, Math.PI / 4]}>
      <circleGeometry args={[30, 32]} />
      <meshBasicMaterial color="#111111" transparent opacity={0.5} wireframe />
    </mesh>
  );
}