"use client";

/** Backboard, rim, net and support pole — a simple original hoop, no real
 * team or arena branding, centered at the world origin every court spot
 * shoots toward. */
export function Hoop() {
  return (
    <group position={[0, 0, 0]}>
      {/* Pole */}
      <mesh position={[0, 1.3, -0.5]}>
        <cylinderGeometry args={[0.09, 0.11, 2.6, 10]} />
        <meshLambertMaterial color="#8a8a94" />
      </mesh>
      {/* Backboard */}
      <mesh position={[0, 2.9, -0.35]}>
        <boxGeometry args={[1.85, 1.15, 0.06]} />
        <meshLambertMaterial color="#f4f6fb" />
      </mesh>
      <mesh position={[0, 2.72, -0.31]}>
        <boxGeometry args={[0.58, 0.39, 0.02]} />
        <meshBasicMaterial color="#e5342f" wireframe />
      </mesh>
      {/* Rim — enlarged from the original 0.23 radius, matching the wider
          scoring radius in core/arcade.ts, to make shots a little easier. */}
      <mesh position={[0, 2.6, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.024, 8, 20]} />
        <meshLambertMaterial color="#e5342f" emissive="#e5342f" emissiveIntensity={0.25} />
      </mesh>
      {/* Net — a simple ring of thin strands, enough to read as a net. */}
      {Array.from({ length: 10 }).map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const x = Math.cos(angle) * 0.27;
        const z = 0.02 + Math.sin(angle) * 0.27;
        return (
          <mesh key={i} position={[x, 2.42, z]} rotation={[0, -angle, 0.12]}>
            <cylinderGeometry args={[0.004, 0.004, 0.36, 4]} />
            <meshBasicMaterial color="#f4f6fb" transparent opacity={0.85} />
          </mesh>
        );
      })}
    </group>
  );
}
