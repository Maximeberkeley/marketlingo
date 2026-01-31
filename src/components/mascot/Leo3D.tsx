import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { motion } from "framer-motion";
import * as THREE from "three";

type AnimationState = "idle" | "jumping" | "spinning" | "celebrating" | "waving" | "bouncing" | "thinking";

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
      roughness={0.55}
      metalness={0.08}
      emissive={emissive}
      emissiveIntensity={0.08}
    />
  );
}

// 3D Fox character built from geometric primitives - Disney/Pixar Claymorphism style
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
  const hatRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [blinkState, setBlinkState] = useState(false);
  
  const animationRef = useRef({
    time: 0,
    spinAngle: 0,
    blinkTimer: 0,
  });

  // Color palette - warm fox colors (Pixar style)
  const colors = {
    body: "#F97316",      // Vibrant orange
    bodyDark: "#EA580C",  // Darker orange for shading
    belly: "#FED7AA",     // Light peach/cream
    nose: "#1C1917",      // Dark nose
    eyes: "#1C1917",      // Dark eyes
    eyeWhite: "#FFFFFF",
    eyeHighlight: "#FFFFFF",
    earInner: "#FECACA",  // Pink inner ear
    cheeks: "#FDBA74",    // Warm orange for cheeks
    hatBody: "#1E3A5F",   // Navy blue graduation hat
    hatTop: "#0F2744",    // Darker navy for top
    tassel: "#EAB308",    // Gold tassel
    tasselTip: "#FCD34D", // Lighter gold
  };

  // Blink effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinkState(true);
      setTimeout(() => setBlinkState(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current || !headRef.current) return;
    
    const anim = animationRef.current;
    anim.time += delta;
    
    const hoverScale = hovered ? 1.06 : 1;
    const baseScale = 0.75;
    
    // Reset transforms
    groupRef.current.position.set(0, 0, 0);
    groupRef.current.rotation.set(0, 0, 0);
    groupRef.current.scale.setScalar(baseScale * hoverScale);
    
    // Ear wiggle (always subtle)
    if (leftEarRef.current && rightEarRef.current) {
      leftEarRef.current.rotation.z = Math.sin(anim.time * 2.5) * 0.08;
      rightEarRef.current.rotation.z = -Math.sin(anim.time * 2.5) * 0.08;
    }
    
    // Tail wag (always active)
    if (tailRef.current) {
      tailRef.current.rotation.z = Math.sin(anim.time * 3.5) * 0.25 + 0.4;
    }

    // Hat subtle movement with head
    if (hatRef.current) {
      hatRef.current.rotation.z = Math.sin(anim.time * 1.5) * 0.02;
    }
    
    switch (animation) {
      case "idle":
        // Gentle breathing/floating with subtle body sway
        groupRef.current.position.y = Math.sin(anim.time * 1.8) * 0.06;
        groupRef.current.rotation.z = Math.sin(anim.time * 1.2) * 0.015;
        // Head subtle movement
        headRef.current.rotation.z = Math.sin(anim.time * 1.0) * 0.025;
        headRef.current.rotation.x = Math.sin(anim.time * 0.7) * 0.015;
        break;
        
      case "jumping":
        const jumpProgress = (Math.sin(anim.time * 5) + 1) / 2;
        const jumpHeight = Math.pow(jumpProgress, 0.5) * 0.45;
        groupRef.current.position.y = jumpHeight;
        
        // Squash and stretch
        const stretchY = 1 + jumpHeight * 0.18;
        const squashX = 1 - jumpHeight * 0.06;
        groupRef.current.scale.set(
          baseScale * squashX * hoverScale,
          baseScale * stretchY * hoverScale,
          baseScale * squashX * hoverScale
        );
        
        // Happy tilt
        groupRef.current.rotation.x = Math.sin(anim.time * 5) * 0.12;
        break;
        
      case "spinning":
        anim.spinAngle += delta * 4.5;
        groupRef.current.rotation.y = anim.spinAngle;
        groupRef.current.position.y = Math.sin(anim.time * 2.5) * 0.08 + 0.08;
        break;
        
      case "celebrating":
        const celebrateHeight = Math.abs(Math.sin(anim.time * 7)) * 0.32;
        groupRef.current.position.y = celebrateHeight;
        groupRef.current.rotation.z = Math.sin(anim.time * 9) * 0.1;
        groupRef.current.rotation.y = Math.sin(anim.time * 3.5) * 0.25;
        
        // Excited head bobbing
        headRef.current.rotation.z = Math.sin(anim.time * 10) * 0.08;
        break;
        
      case "waving":
        groupRef.current.position.y = Math.sin(anim.time * 1.8) * 0.05;
        groupRef.current.rotation.z = Math.sin(anim.time * 2.5) * 0.12;
        // Look side to side warmly
        headRef.current.rotation.y = Math.sin(anim.time * 1.8) * 0.18;
        break;

      case "thinking":
        // Thoughtful pose - slight head tilt
        groupRef.current.position.y = Math.sin(anim.time * 1.5) * 0.04;
        headRef.current.rotation.z = 0.1 + Math.sin(anim.time * 0.8) * 0.03;
        headRef.current.rotation.y = 0.15;
        break;
        
      case "bouncing":
        const bouncePhase = anim.time * 4.5;
        const bounce = Math.abs(Math.sin(bouncePhase));
        const squishFactor = 1 - (1 - bounce) * 0.18;
        
        groupRef.current.position.y = bounce * 0.35;
        groupRef.current.scale.set(
          baseScale * (1 / squishFactor) * hoverScale,
          baseScale * squishFactor * hoverScale,
          baseScale * (1 / squishFactor) * hoverScale
        );
        break;
    }
  });

  const eyeScaleY = blinkState ? 0.1 : 1;

  return (
    <group
      ref={groupRef}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Body - rounded oval with subtle shading */}
      <mesh position={[0, -0.32, 0]}>
        <sphereGeometry args={[0.44, 32, 32]} />
        <ClayMaterial color={colors.body} emissive={colors.body} />
      </mesh>
      
      {/* Body shading (darker underside) */}
      <mesh position={[0, -0.45, 0]}>
        <sphereGeometry args={[0.38, 32, 32]} />
        <ClayMaterial color={colors.bodyDark} />
      </mesh>
      
      {/* Belly patch */}
      <mesh position={[0, -0.28, 0.34]}>
        <sphereGeometry args={[0.27, 32, 32]} />
        <ClayMaterial color={colors.belly} />
      </mesh>
      
      {/* Head */}
      <group ref={headRef} position={[0, 0.22, 0]}>
        {/* Main head sphere */}
        <mesh>
          <sphereGeometry args={[0.40, 32, 32]} />
          <ClayMaterial color={colors.body} emissive={colors.body} />
        </mesh>
        
        {/* Forehead tuft */}
        <mesh position={[0, 0.32, 0.12]} rotation={[0.3, 0, 0]}>
          <coneGeometry args={[0.08, 0.15, 8]} />
          <ClayMaterial color={colors.body} emissive={colors.body} />
        </mesh>
        
        {/* Snout */}
        <mesh position={[0, -0.1, 0.33]}>
          <sphereGeometry args={[0.19, 32, 32]} />
          <ClayMaterial color={colors.belly} />
        </mesh>
        
        {/* Nose */}
        <mesh position={[0, -0.04, 0.50]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color={colors.nose} roughness={0.25} metalness={0.15} />
        </mesh>
        
        {/* Nose highlight */}
        <mesh position={[0.015, -0.02, 0.56]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} transparent opacity={0.6} />
        </mesh>
        
        {/* Left eye white */}
        <mesh position={[-0.13, 0.06, 0.30]}>
          <sphereGeometry args={[0.095, 16, 16]} />
          <meshStandardMaterial color={colors.eyeWhite} roughness={0.15} />
        </mesh>
        
        {/* Left eye pupil */}
        <mesh position={[-0.13, 0.06, 0.395]} scale={[1, eyeScaleY, 1]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color={colors.eyes} roughness={0.08} metalness={0.35} />
        </mesh>
        
        {/* Left eye shine */}
        <mesh position={[-0.10, 0.09, 0.44]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.6} />
        </mesh>
        
        {/* Right eye white */}
        <mesh position={[0.13, 0.06, 0.30]}>
          <sphereGeometry args={[0.095, 16, 16]} />
          <meshStandardMaterial color={colors.eyeWhite} roughness={0.15} />
        </mesh>
        
        {/* Right eye pupil */}
        <mesh position={[0.13, 0.06, 0.395]} scale={[1, eyeScaleY, 1]}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshStandardMaterial color={colors.eyes} roughness={0.08} metalness={0.35} />
        </mesh>
        
        {/* Right eye shine */}
        <mesh position={[0.16, 0.09, 0.44]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.6} />
        </mesh>
        
        {/* Cheek fluff (left) */}
        <mesh position={[-0.30, -0.05, 0.12]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <ClayMaterial color={colors.body} emissive={colors.body} />
        </mesh>
        
        {/* Cheek fluff (right) */}
        <mesh position={[0.30, -0.05, 0.12]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <ClayMaterial color={colors.body} emissive={colors.body} />
        </mesh>
        
        {/* Cheek blush (left) */}
        <mesh position={[-0.22, -0.04, 0.24]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#FECACA" transparent opacity={0.5} roughness={0.9} />
        </mesh>
        
        {/* Cheek blush (right) */}
        <mesh position={[0.22, -0.04, 0.24]}>
          <sphereGeometry args={[0.06, 16, 16]} />
          <meshStandardMaterial color="#FECACA" transparent opacity={0.5} roughness={0.9} />
        </mesh>
        
        {/* Left ear group */}
        <group ref={leftEarRef} position={[-0.26, 0.32, 0]}>
          {/* Outer ear */}
          <mesh rotation={[0, 0, 0.25]}>
            <coneGeometry args={[0.14, 0.32, 16]} />
            <ClayMaterial color={colors.body} emissive={colors.body} />
          </mesh>
          {/* Inner ear */}
          <mesh position={[0.02, -0.02, 0.04]} rotation={[0, 0, 0.25]}>
            <coneGeometry args={[0.07, 0.20, 16]} />
            <ClayMaterial color={colors.earInner} />
          </mesh>
        </group>
        
        {/* Right ear group */}
        <group ref={rightEarRef} position={[0.26, 0.32, 0]}>
          {/* Outer ear */}
          <mesh rotation={[0, 0, -0.25]}>
            <coneGeometry args={[0.14, 0.32, 16]} />
            <ClayMaterial color={colors.body} emissive={colors.body} />
          </mesh>
          {/* Inner ear */}
          <mesh position={[-0.02, -0.02, 0.04]} rotation={[0, 0, -0.25]}>
            <coneGeometry args={[0.07, 0.20, 16]} />
            <ClayMaterial color={colors.earInner} />
          </mesh>
        </group>

        {/* === GRADUATION HAT === */}
        <group ref={hatRef} position={[0, 0.38, -0.02]} rotation={[-0.15, 0, 0]}>
          {/* Hat base (mortarboard) */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.45, 0.04, 0.45]} />
            <meshStandardMaterial color={colors.hatBody} roughness={0.4} metalness={0.1} />
          </mesh>
          
          {/* Hat top piece (the cap part) */}
          <mesh position={[0, -0.08, 0]}>
            <cylinderGeometry args={[0.12, 0.16, 0.12, 16]} />
            <meshStandardMaterial color={colors.hatTop} roughness={0.35} metalness={0.1} />
          </mesh>
          
          {/* Button on top */}
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.02, 8]} />
            <meshStandardMaterial color={colors.tassel} roughness={0.2} metalness={0.4} />
          </mesh>
          
          {/* Tassel cord */}
          <mesh position={[0.15, 0.02, 0.15]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.008, 0.008, 0.18, 8]} />
            <meshStandardMaterial color={colors.tassel} roughness={0.3} metalness={0.3} />
          </mesh>
          
          {/* Tassel end */}
          <mesh position={[0.22, -0.06, 0.22]}>
            <cylinderGeometry args={[0.025, 0.015, 0.08, 8]} />
            <meshStandardMaterial color={colors.tasselTip} roughness={0.25} metalness={0.35} />
          </mesh>
          
          {/* Tassel fringe pieces */}
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0.22 + Math.sin(i * 1.2) * 0.015, -0.12, 0.22 + Math.cos(i * 1.2) * 0.015]}>
              <cylinderGeometry args={[0.004, 0.002, 0.04, 4]} />
              <meshStandardMaterial color={colors.tassel} roughness={0.3} metalness={0.3} />
            </mesh>
          ))}
        </group>
      </group>
      
      {/* Tail */}
      <mesh ref={tailRef} position={[-0.32, -0.42, -0.18]}>
        <capsuleGeometry args={[0.11, 0.45, 8, 16]} />
        <ClayMaterial color={colors.body} emissive={colors.body} />
      </mesh>
      
      {/* Tail tip (white/cream) */}
      <mesh position={[-0.52, -0.22, -0.18]} rotation={[0, 0, 0.45]}>
        <sphereGeometry args={[0.11, 16, 16]} />
        <ClayMaterial color={colors.belly} />
      </mesh>
      
      {/* Front left paw */}
      <mesh position={[-0.20, -0.70, 0.08]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <ClayMaterial color={colors.body} />
      </mesh>
      
      {/* Front right paw */}
      <mesh position={[0.20, -0.70, 0.08]}>
        <sphereGeometry args={[0.09, 16, 16]} />
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
      style={{ width: size, height: size }}
      className="relative cursor-pointer leo-3d-container"
    >
      {/* White sticker outline effect */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.4) 40%, transparent 70%)",
          transform: "scale(1.08)",
          filter: "blur(2px)",
          zIndex: 0,
        }}
      />
      
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 45 }}
        style={{ background: "transparent", position: "relative", zIndex: 1 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Premium cinematic lighting setup */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[3, 5, 5]} intensity={1.1} color="#FFFFFF" castShadow />
        <directionalLight position={[-3, 2, 3]} intensity={0.35} color="#FDE68A" />
        <pointLight position={[0, 2, 2]} intensity={0.5} color="#FBBF24" />
        {/* Rim light for premium edge highlight */}
        <directionalLight position={[0, 0, -3]} intensity={0.25} color="#60A5FA" />
        {/* Fill light from below */}
        <directionalLight position={[0, -2, 2]} intensity={0.15} color="#FED7AA" />
        
        <Suspense fallback={null}>
          <LeoCharacter animation={animation} onClick={onClick} />
        </Suspense>
      </Canvas>
      
      {/* Soft drop shadow */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-3/4 h-4 rounded-full bg-black/25 blur-md"
        style={{ transform: "translateX(-50%) scaleY(0.4)" }}
      />
      
      {/* Ambient glow behind character */}
      <div 
        className="absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-primary/25 to-orange-500/15 blur-2xl animate-pulse"
        style={{ transform: "scale(0.75)" }}
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
