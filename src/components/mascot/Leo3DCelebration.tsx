import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useTexture, Stars } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import leoMascot from "@/assets/mascot/leo-mascot.png";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useEffect } from "react";

interface Leo3DCelebrationProps {
  isVisible: boolean;
  type: "lesson" | "game" | "drill" | "achievement" | "streak";
  message?: string;
  onComplete?: () => void;
}

function CelebrationLeo() {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(leoMascot);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    
    // Excited jumping and spinning
    const jumpHeight = Math.abs(Math.sin(timeRef.current * 5)) * 0.5;
    meshRef.current.position.y = jumpHeight - 0.2;
    
    // Spin on Y axis
    meshRef.current.rotation.y = timeRef.current * 3;
    
    // Wobble on Z
    meshRef.current.rotation.z = Math.sin(timeRef.current * 8) * 0.15;
    
    // Scale pulse
    const scale = 1 + Math.sin(timeRef.current * 6) * 0.1;
    meshRef.current.scale.setScalar(scale);
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[1.5, 1.5]} />
      <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

function Confetti() {
  const confettiRef = useRef<THREE.Points>(null);
  const particleCount = 100;
  
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const velocities = useRef<Float32Array>(new Float32Array(particleCount * 3));
  
  // Initialize positions and colors
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 4;
    positions[i * 3 + 1] = Math.random() * 3 + 1;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
    
    // Random bright colors
    const colorIndex = Math.floor(Math.random() * 5);
    const confettiColors = [
      [1, 0.84, 0],    // Gold
      [1, 0.4, 0.7],   // Pink
      [0.5, 0.5, 1],   // Purple
      [0, 0.8, 0.8],   // Cyan
      [0.3, 1, 0.3],   // Green
    ];
    colors[i * 3] = confettiColors[colorIndex][0];
    colors[i * 3 + 1] = confettiColors[colorIndex][1];
    colors[i * 3 + 2] = confettiColors[colorIndex][2];
    
    // Velocities
    velocities.current[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities.current[i * 3 + 1] = -Math.random() * 0.03 - 0.01;
    velocities.current[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
  }

  useFrame(() => {
    if (!confettiRef.current) return;
    
    const positions = confettiRef.current.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] += velocities.current[i * 3];
      positions[i * 3 + 1] += velocities.current[i * 3 + 1];
      positions[i * 3 + 2] += velocities.current[i * 3 + 2];
      
      // Reset if fallen too far
      if (positions[i * 3 + 1] < -2) {
        positions[i * 3 + 1] = 3;
        positions[i * 3] = (Math.random() - 0.5) * 4;
      }
    }
    
    confettiRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={confettiRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.08} vertexColors transparent opacity={0.9} />
    </points>
  );
}

const celebrationMessages = {
  lesson: ["Lesson mastered! 🎓", "Knowledge unlocked!", "You crushed it!"],
  game: ["Game champion! 🏆", "High score!", "Brain power!"],
  drill: ["Speed demon! ⚡", "Lightning fast!", "Quick thinking!"],
  achievement: ["Achievement unlocked! 🌟", "New milestone!", "You're growing!"],
  streak: ["Streak on fire! 🔥", "Keep it going!", "Unstoppable!"],
};

export function Leo3DCelebration({ 
  isVisible, 
  type, 
  message, 
  onComplete 
}: Leo3DCelebrationProps) {
  const { play } = useSoundEffects();
  
  const randomMessage = message || 
    celebrationMessages[type][Math.floor(Math.random() * celebrationMessages[type].length)];

  useEffect(() => {
    if (isVisible) {
      play("celebration");
    }
  }, [isVisible, play]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onComplete}
        >
          {/* Background */}
          <div className="absolute inset-0 bg-black/70" />
          
          {/* 3D Canvas */}
          <div className="absolute inset-0">
            <Canvas camera={{ position: [0, 0, 3], fov: 60 }}>
              <ambientLight intensity={0.8} />
              <pointLight position={[5, 5, 5]} intensity={1} />
              <Suspense fallback={null}>
                <CelebrationLeo />
                <Confetti />
                <Stars radius={10} depth={50} count={200} factor={2} fade speed={2} />
              </Suspense>
            </Canvas>
          </div>
          
          {/* UI Overlay */}
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 15, delay: 0.3 }}
            className="relative z-10 text-center mt-48"
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-bold text-white mb-2 drop-shadow-lg"
            >
              {randomMessage}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ delay: 1, duration: 1.5, repeat: Infinity }}
              className="text-white/70 text-sm"
            >
              Tap anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
