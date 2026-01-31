import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "framer-motion";
import * as THREE from "three";

type AnimationState = "idle" | "jumping" | "spinning" | "celebrating" | "waving" | "bouncing";

interface Leo3DProps {
  animation?: AnimationState;
  message?: string;
  size?: number;
  onClick?: () => void;
}

// Premium claymorphism material with soft lighting
function ClayMaterial({ color, emissive = "#000000" }: { color: string; emissive?: string }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.6}
      metalness={0.05}
      emissive={emissive}
      emissiveIntensity={0.1}
    />
  );
}

// 3D Fox character built from geometric primitives
function LeoCharacter({ 
  animation = "idle",
  onClick,
}: { 
  animation: AnimationState;
  onClick?: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  const animationRef = useRef({
    time: 0,
    spinAngle: 0,
  });

  // Color palette - warm fox colors
  const colors = {
    body: "#F97316",      // Vibrant orange
    belly: "#FED7AA",     // Light peach
    nose: "#1C1917",      // Dark nose
    eyes: "#1C1917",      // Dark eyes
    eyeWhite: "#FFFFFF",
    earInner: "#FECACA",  // Pink inner ear
    cheeks: "#FB923C",    // Warm orange for cheeks
  };

  useFrame((state, delta) => {
    if (!groupRef.current || !headRef.current) return;
    
    const anim = animationRef.current;
    anim.time += delta;
    
    const hoverScale = hovered ? 1.08 : 1;
    const baseScale = 0.8;
    
    // Reset transforms
    groupRef.current.position.set(0, 0, 0);
    groupRef.current.rotation.set(0, 0, 0);
    groupRef.current.scale.setScalar(baseScale * hoverScale);
    
    // Ear wiggle (always subtle)
    if (leftEarRef.current && rightEarRef.current) {
      leftEarRef.current.rotation.z = Math.sin(anim.time * 3) * 0.1;
      rightEarRef.current.rotation.z = -Math.sin(anim.time * 3) * 0.1;
    }
    
    // Tail wag (always active)
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(anim.time * 4) * 0.3 + 0.5;
    }
    
    switch (animation) {
      case "idle":
        // Gentle breathing/floating
        groupRef.current.position.y = Math.sin(anim.time * 2) * 0.08;
        groupRef.current.rotation.z = Math.sin(anim.time * 1.5) * 0.02;
        // Head slight tilt
        headRef.current.rotation.z = Math.sin(anim.time * 1.2) * 0.03;
        headRef.current.rotation.x = Math.sin(anim.time * 0.8) * 0.02;
        break;
        
      case "jumping":
        const jumpProgress = (Math.sin(anim.time * 6) + 1) / 2;
        const jumpHeight = Math.pow(jumpProgress, 0.5) * 0.5;
        groupRef.current.position.y = jumpHeight;
        
        // Squash and stretch
        const stretchY = 1 + jumpHeight * 0.2;
        const squashX = 1 - jumpHeight * 0.08;
        groupRef.current.scale.set(
          baseScale * squashX * hoverScale,
          baseScale * stretchY * hoverScale,
          baseScale * squashX * hoverScale
        );
        
        // Anticipation rotation
        groupRef.current.rotation.x = Math.sin(anim.time * 6) * 0.15;
        break;
        
      case "spinning":
        anim.spinAngle += delta * 5;
        groupRef.current.rotation.y = anim.spinAngle;
        groupRef.current.position.y = Math.sin(anim.time * 3) * 0.1 + 0.1;
        break;
        
      case "celebrating":
        const celebrateHeight = Math.abs(Math.sin(anim.time * 8)) * 0.35;
        groupRef.current.position.y = celebrateHeight;
        groupRef.current.rotation.z = Math.sin(anim.time * 10) * 0.12;
        groupRef.current.rotation.y = Math.sin(anim.time * 4) * 0.3;
        
        // Excited head bobbing
        headRef.current.rotation.z = Math.sin(anim.time * 12) * 0.1;
        break;
        
      case "waving":
        groupRef.current.position.y = Math.sin(anim.time * 2) * 0.06;
        groupRef.current.rotation.z = Math.sin(anim.time * 3) * 0.15;
        // Look side to side
        headRef.current.rotation.y = Math.sin(anim.time * 2) * 0.2;
        break;
        
      case "bouncing":
        const bouncePhase = anim.time * 5;
        const bounce = Math.abs(Math.sin(bouncePhase));
        const squishFactor = 1 - (1 - bounce) * 0.2;
        
        groupRef.current.position.y = bounce * 0.4;
        groupRef.current.scale.set(
          baseScale * (1 / squishFactor) * hoverScale,
          baseScale * squishFactor * hoverScale,
          baseScale * (1 / squishFactor) * hoverScale
        );
        break;
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Body - rounded oval */}
      <mesh position={[0, -0.3, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <ClayMaterial color={colors.body} emissive={colors.body} />
      </mesh>
      
      {/* Belly patch */}
      <mesh position={[0, -0.25, 0.35]}>
        <sphereGeometry args={[0.28, 32, 32]} />
        <ClayMaterial color={colors.belly} />
      </mesh>
      
      {/* Head */}
      <group ref={headRef} position={[0, 0.25, 0]}>
        {/* Main head sphere */}
        <mesh>
          <sphereGeometry args={[0.42, 32, 32]} />
          <ClayMaterial color={colors.body} emissive={colors.body} />
        </mesh>
        
        {/* Snout */}
        <mesh position={[0, -0.08, 0.35]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <ClayMaterial color={colors.belly} />
        </mesh>
        
        {/* Nose */}
        <mesh position={[0, -0.02, 0.52]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color={colors.nose} roughness={0.3} metalness={0.1} />
        </mesh>
        
        {/* Left eye white */}
        <mesh position={[-0.14, 0.08, 0.32]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={colors.eyeWhite} roughness={0.2} />
        </mesh>
        
        {/* Left eye pupil */}
        <mesh position={[-0.14, 0.08, 0.41]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={colors.eyes} roughness={0.1} metalness={0.3} />
        </mesh>
        
        {/* Left eye shine */}
        <mesh position={[-0.11, 0.11, 0.45]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
        </mesh>
        
        {/* Right eye white */}
        <mesh position={[0.14, 0.08, 0.32]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={colors.eyeWhite} roughness={0.2} />
        </mesh>
        
        {/* Right eye pupil */}
        <mesh position={[0.14, 0.08, 0.41]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color={colors.eyes} roughness={0.1} metalness={0.3} />
        </mesh>
        
        {/* Right eye shine */}
        <mesh position={[0.17, 0.11, 0.45]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.5} />
        </mesh>
        
        {/* Cheeks (blush) */}
        <mesh position={[-0.25, -0.02, 0.25]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#FECACA" transparent opacity={0.6} roughness={0.8} />
        </mesh>
        <mesh position={[0.25, -0.02, 0.25]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial color="#FECACA" transparent opacity={0.6} roughness={0.8} />
        </mesh>
        
        {/* Left ear group */}
        <group ref={leftEarRef} position={[-0.28, 0.35, 0]}>
          {/* Outer ear */}
          <mesh rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.15, 0.35, 16]} />
            <ClayMaterial color={colors.body} emissive={colors.body} />
          </mesh>
          {/* Inner ear */}
          <mesh position={[0.02, -0.02, 0.05]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.08, 0.22, 16]} />
            <ClayMaterial color={colors.earInner} />
          </mesh>
        </group>
        
        {/* Right ear group */}
        <group ref={rightEarRef} position={[0.28, 0.35, 0]}>
          {/* Outer ear */}
          <mesh rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.15, 0.35, 16]} />
            <ClayMaterial color={colors.body} emissive={colors.body} />
          </mesh>
          {/* Inner ear */}
          <mesh position={[-0.02, -0.02, 0.05]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.08, 0.22, 16]} />
            <ClayMaterial color={colors.earInner} />
          </mesh>
        </group>
      </group>
      
      {/* Tail */}
      <mesh ref={tailRef} position={[-0.35, -0.4, -0.2]}>
        <capsuleGeometry args={[0.12, 0.5, 8, 16]} />
        <ClayMaterial color={colors.body} emissive={colors.body} />
      </mesh>
      
      {/* Tail tip (white) */}
      <mesh position={[-0.55, -0.2, -0.2]} rotation={[0, 0, 0.5]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <ClayMaterial color={colors.belly} />
      </mesh>
      
      {/* Front left paw */}
      <mesh position={[-0.22, -0.7, 0.1]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <ClayMaterial color={colors.body} />
      </mesh>
      
      {/* Front right paw */}
      <mesh position={[0.22, -0.7, 0.1]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <ClayMaterial color={colors.body} />
      </mesh>
    </group>
  );
}

export function Leo3D({ 
  animation = "idle", 
  message,
  size = 120,
  onClick 
}: Leo3DProps) {
  return (
    <div 
      style={{ width: size, height: size, cursor: onClick ? "pointer" : "default" }}
      className="relative"
    >
      <Canvas
        camera={{ position: [0, 0, 3], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Premium lighting setup for claymorphism look */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 5]} intensity={1} color="#FFFFFF" />
        <directionalLight position={[-3, 2, 3]} intensity={0.4} color="#FDE68A" />
        <pointLight position={[0, 2, 2]} intensity={0.6} color="#FBBF24" />
        {/* Rim light for premium edge highlight */}
        <directionalLight position={[0, 0, -3]} intensity={0.3} color="#60A5FA" />
        
        <Suspense fallback={null}>
          <LeoCharacter animation={animation} onClick={onClick} />
        </Suspense>
      </Canvas>
      
      {/* Soft glow shadow */}
      <div 
        className="absolute inset-x-4 -bottom-2 h-4 rounded-full bg-black/20 blur-md"
        style={{ transform: "scaleY(0.5)" }}
      />
      
      {/* Ambient glow behind character */}
      <div 
        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-accent/30 to-orange-500/20 blur-2xl animate-pulse"
        style={{ transform: "scale(0.7)" }}
      />
    </div>
  );
}

// Interactive 3D Leo with tap-to-animate
export function Leo3DInteractive({
  size = 120,
  initialMessage,
  onTap,
}: {
  size?: number;
  initialMessage?: string;
  onTap?: () => void;
}) {
  const [animation, setAnimation] = useState<AnimationState>("idle");
  const [message, setMessage] = useState(initialMessage);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    if (initialMessage && animation === "idle") {
      setMessage(initialMessage);
    }
  }, [initialMessage, animation]);

  const animations: AnimationState[] = ["jumping", "spinning", "celebrating", "bouncing", "waving"];
  const messages = [
    "Wheee! 🎉",
    "I'm spinning!",
    "Let's goooo! 🚀",
    "Boing boing!",
    "Hi there! 👋",
  ];

  const handleTap = () => {
    const nextIndex = tapCount % animations.length;
    setAnimation(animations[nextIndex]);
    setMessage(messages[nextIndex]);
    setTapCount(prev => prev + 1);
    
    setTimeout(() => {
      setAnimation("idle");
      setMessage(initialMessage);
    }, 2000);
    
    onTap?.();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <Leo3D 
        animation={animation}
        size={size}
        onClick={handleTap}
      />
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: -5, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="px-3 py-1.5 rounded-xl bg-bg-2 border border-accent/30 shadow-lg"
        >
          <p className="text-xs text-text-primary font-medium text-center max-w-[150px]">
            {message}
          </p>
          <p className="text-[9px] text-accent text-center">— Leo</p>
        </motion.div>
      )}
    </div>
  );
}
