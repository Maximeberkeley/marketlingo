import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment, Float, Lightformer } from "@react-three/drei";
import * as THREE from "three";

export type StageKey = "recall" | "discover" | "predict" | "apply" | "decide" | "debrief";

export interface StagePalette {
  /** Scene background (top, bottom) */
  bg: [string, string];
  /** Primary object colour */
  key: string;
  /** Secondary / emissive colour */
  glow: string;
  fog: string;
}

export const STAGE_PALETTE: Record<StageKey, StagePalette> = {
  recall:   { bg: ["#120E2A", "#241A4D"], key: "#A78BFA", glow: "#6D28D9", fog: "#1A1338" },
  discover: { bg: ["#0B1B2B", "#123A52"], key: "#38BDF8", glow: "#0EA5E9", fog: "#0E2436" },
  predict:  { bg: ["#2A1405", "#4A230A"], key: "#FB923C", glow: "#F97316", fog: "#331A08" },
  apply:    { bg: ["#04211F", "#0A3F38"], key: "#2DD4BF", glow: "#14B8A6", fog: "#062B28" },
  decide:   { bg: ["#0A0A1F", "#2B0B45"], key: "#C084FC", glow: "#7C3AED", fog: "#100A26" },
  debrief:  { bg: ["#0D1224", "#1E1B4B"], key: "#FBBF24", glow: "#F59E0B", fog: "#141834" },
};

/* ── Stage artifacts ───────────────────────────────────────── */

function Shards({ palette }: { palette: StagePalette }) {
  const group = useRef<THREE.Group>(null);
  const shards = useMemo(
    () =>
      Array.from({ length: 7 }).map((_, i) => ({
        pos: [
          Math.cos((i / 7) * Math.PI * 2) * 2.6,
          Math.sin(i * 1.7) * 0.7,
          Math.sin((i / 7) * Math.PI * 2) * 2.6,
        ] as [number, number, number],
        scale: 0.2 + (i % 3) * 0.07,
        speed: 0.3 + i * 0.07,
      })),
    []
  );

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.25;
  });

  return (
    <group ref={group}>
      {shards.map((s, i) => (
        <Float key={i} speed={s.speed * 3} floatIntensity={0.8} rotationIntensity={1.2}>
          <mesh position={s.pos} castShadow>
            <octahedronGeometry args={[s.scale, 0]} />
            <meshStandardMaterial
              color={palette.key}
              emissive={palette.glow}
              emissiveIntensity={0.5}
              metalness={0.7}
              roughness={0.18}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Crystal({ palette }: { palette: StagePalette }) {
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (core.current) {
      core.current.rotation.y += delta * 0.4;
      core.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.2;
    }
    if (ring.current) ring.current.rotation.z += delta * 0.6;
  });

  return (
    <group>
      <mesh ref={core} castShadow>
        <icosahedronGeometry args={[1.25, 0]} />
        <meshStandardMaterial
          color={palette.key}
          emissive={palette.glow}
          emissiveIntensity={0.55}
          metalness={0.85}
          roughness={0.12}
          flatShading
        />
      </mesh>
      <mesh ref={ring} rotation={[Math.PI / 2.6, 0, 0]}>
        <torusGeometry args={[2.1, 0.05, 12, 90]} />
        <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={1.4} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <Float key={i} speed={2 + i} floatIntensity={1.4} rotationIntensity={1}>
          <mesh position={[Math.cos(i * 2.1) * 2.4, Math.sin(i * 1.3) * 1.1, Math.sin(i * 2.1) * 1.6]}>
            <dodecahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial color="#ffffff" emissive={palette.key} emissiveIntensity={0.8} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Fork({ palette, choice }: { palette: StagePalette; choice: number | null }) {
  const group = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (group.current) group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.25;
  });

  const branches: { x: number; index: number }[] = [
    { x: -1.6, index: 0 },
    { x: 1.6, index: 1 },
  ];

  return (
    <group ref={group}>
      <mesh position={[0, -1.4, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 1.4, 24]} />
        <meshStandardMaterial color={palette.key} emissive={palette.glow} emissiveIntensity={0.3} metalness={0.6} roughness={0.3} />
      </mesh>
      {branches.map(({ x, index }) => {
        const active = choice === index;
        const dim = choice !== null && !active;
        return (
          <group key={index} position={[x, 0.1, 0]}>
            <mesh rotation={[0, 0, x > 0 ? -0.7 : 0.7]} position={[-x * 0.42, -0.95, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 1.9, 16]} />
              <meshStandardMaterial color={palette.key} transparent opacity={dim ? 0.2 : 0.85} emissive={palette.glow} emissiveIntensity={0.25} />
            </mesh>
            <Float speed={active ? 4 : 1.6} floatIntensity={active ? 1.4 : 0.6}>
              <mesh castShadow scale={active ? 1.25 : 1}>
                <sphereGeometry args={[0.62, 32, 32]} />
                <meshStandardMaterial
                  color={active ? "#ffffff" : palette.key}
                  emissive={active ? palette.glow : palette.glow}
                  emissiveIntensity={active ? 1.4 : 0.35}
                  transparent
                  opacity={dim ? 0.25 : 1}
                  metalness={0.5}
                  roughness={0.2}
                />
              </mesh>
            </Float>
          </group>
        );
      })}
    </group>
  );
}

function DataStacks({ palette }: { palette: StagePalette }) {
  const group = useRef<THREE.Group>(null);
  const bars = useMemo(() => [1.1, 1.9, 1.4, 2.4, 1.7], []);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.18;
    group.current.children.forEach((child, i) => {
      const target = bars[i] * (0.75 + 0.25 * Math.sin(state.clock.elapsedTime * 1.2 + i));
      child.scale.y += (target - child.scale.y) * (1 - Math.exp(-4 * delta));
      child.position.y = child.scale.y / 2 - 1.1;
    });
  });

  return (
    <group ref={group}>
      {bars.map((h, i) => (
        <mesh key={i} position={[(i - 2) * 0.75, h / 2 - 1.1, 0]} scale={[1, h, 1]} castShadow>
          <boxGeometry args={[0.5, 1, 0.5]} />
          <meshStandardMaterial
            color={palette.key}
            emissive={palette.glow}
            emissiveIntensity={0.25 + i * 0.08}
            metalness={0.55}
            roughness={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

function Monolith({ palette, choice }: { palette: StagePalette; choice: number | null }) {
  const core = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (core.current) {
      core.current.rotation.y += delta * 0.5;
      const pulse = 1 + Math.sin(t * (choice === null ? 2.4 : 5)) * 0.06;
      core.current.scale.setScalar(pulse);
    }
    if (halo.current) {
      halo.current.rotation.x += delta * 0.4;
      halo.current.rotation.y -= delta * 0.25;
    }
  });

  return (
    <group>
      <mesh ref={core} castShadow>
        <octahedronGeometry args={[1.4, 0]} />
        <meshStandardMaterial
          color={palette.key}
          emissive={palette.glow}
          emissiveIntensity={choice === null ? 0.6 : 1.3}
          metalness={0.9}
          roughness={0.1}
          flatShading
        />
      </mesh>
      <mesh ref={halo}>
        <torusGeometry args={[2.3, 0.035, 10, 100]} />
        <meshStandardMaterial color={palette.glow} emissive={palette.glow} emissiveIntensity={2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.9, 0.02, 8, 120]} />
        <meshStandardMaterial color="#ffffff" emissive={palette.key} emissiveIntensity={1.2} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

function Trophy({ palette }: { palette: StagePalette }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.5;
  });
  return (
    <group ref={group}>
      <Float speed={2} floatIntensity={0.7}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <sphereGeometry args={[0.85, 32, 32]} />
          <meshStandardMaterial color={palette.key} emissive={palette.glow} emissiveIntensity={0.7} metalness={0.9} roughness={0.12} />
        </mesh>
      </Float>
      <mesh position={[0, -0.75, 0]} castShadow>
        <cylinderGeometry args={[0.9, 1.1, 0.35, 32]} />
        <meshStandardMaterial color="#2A2550" metalness={0.7} roughness={0.35} />
      </mesh>
      {Array.from({ length: 10 }).map((_, i) => (
        <Float key={i} speed={1.5 + i * 0.2} floatIntensity={2} rotationIntensity={2}>
          <mesh position={[Math.cos(i) * 2.4, Math.sin(i * 2.1) * 1.6, Math.sin(i) * 1.8]}>
            <tetrahedronGeometry args={[0.16, 0]} />
            <meshStandardMaterial color={palette.key} emissive={palette.glow} emissiveIntensity={1} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Artifact({ stage, palette, choice }: { stage: StageKey; palette: StagePalette; choice: number | null }) {
  switch (stage) {
    case "recall":
      return <Shards palette={palette} />;
    case "discover":
      return <Crystal palette={palette} />;
    case "predict":
      return <Fork palette={palette} choice={choice} />;
    case "apply":
      return <DataStacks palette={palette} />;
    case "decide":
      return <Monolith palette={palette} choice={choice} />;
    default:
      return <Trophy palette={palette} />;
  }
}

/* ── Canvas ────────────────────────────────────────────────── */

export function StageScene({
  stage,
  choice = null,
}: {
  stage: StageKey;
  choice?: number | null;
}) {
  const palette = STAGE_PALETTE[stage];

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.6, 9.5], fov: 42 }}
      gl={{ antialias: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={[palette.bg[0]]} />
      <fog attach="fog" args={[palette.fog, 8, 20]} />

      <ambientLight intensity={0.55} />
      <directionalLight
        position={[4, 8, 6]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-5, -2, -4]} intensity={30} color={palette.glow} />

      <Suspense fallback={null}>
        <group position={[0, -0.8, 0]} scale={0.7}>
          <Artifact stage={stage} palette={palette} choice={choice} />
        </group>
        <ContactShadows position={[0, -0.6, 0]} opacity={0.5} scale={12} blur={2.6} far={5} color="#000000" />
        <Environment>
          <Lightformer intensity={2.2} position={[0, 5, 2]} scale={[10, 6, 1]} color="#ffffff" />
          <Lightformer intensity={1.4} color={palette.glow} position={[-6, 1, -2]} rotation-y={Math.PI / 2} scale={[16, 4, 1]} />
          <Lightformer intensity={1} color={palette.key} position={[6, -1, 2]} rotation-y={-Math.PI / 2} scale={[16, 4, 1]} />
        </Environment>
      </Suspense>
    </Canvas>
  );
}
