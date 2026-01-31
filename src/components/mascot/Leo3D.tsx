import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, Text, useTexture } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";
import leoMascot from "@/assets/mascot/leo-mascot.png";

type AnimationState = "idle" | "jumping" | "spinning" | "celebrating" | "waving" | "bouncing";

interface Leo3DProps {
  animation?: AnimationState;
  message?: string;
  size?: number;
  onClick?: () => void;
}

function LeoSprite({ 
  animation = "idle",
  onClick,
}: { 
  animation: AnimationState;
  onClick?: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const texture = useTexture(leoMascot);
  const [hovered, setHovered] = useState(false);
  
  // Animation state
  const animationRef = useRef({
    time: 0,
    jumpPhase: 0,
    spinAngle: 0,
    bouncePhase: 0,
    waveAngle: 0,
  });

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const anim = animationRef.current;
    anim.time += delta;
    
    // Base hover effect
    const hoverScale = hovered ? 1.1 : 1;
    
    switch (animation) {
      case "idle":
        // Gentle floating
        meshRef.current.position.y = Math.sin(anim.time * 2) * 0.05;
        meshRef.current.rotation.z = Math.sin(anim.time * 1.5) * 0.03;
        meshRef.current.scale.setScalar(hoverScale);
        break;
        
      case "jumping":
        // Jump animation with squash and stretch
        const jumpProgress = (Math.sin(anim.time * 6) + 1) / 2;
        const jumpHeight = Math.pow(jumpProgress, 0.5) * 0.4;
        meshRef.current.position.y = jumpHeight;
        
        // Squash at bottom, stretch at top
        const stretchY = 1 + jumpHeight * 0.3;
        const squashX = 1 - jumpHeight * 0.1;
        meshRef.current.scale.set(squashX * hoverScale, stretchY * hoverScale, 1);
        
        // Slight rotation during jump
        meshRef.current.rotation.z = Math.sin(anim.time * 6) * 0.1;
        break;
        
      case "spinning":
        // 3D spin effect
        anim.spinAngle += delta * 4;
        meshRef.current.rotation.y = anim.spinAngle;
        meshRef.current.position.y = Math.sin(anim.time * 3) * 0.1;
        meshRef.current.scale.setScalar(hoverScale);
        break;
        
      case "celebrating":
        // Excited bouncing with rotation
        const celebrateHeight = Math.abs(Math.sin(anim.time * 8)) * 0.3;
        meshRef.current.position.y = celebrateHeight;
        meshRef.current.rotation.z = Math.sin(anim.time * 10) * 0.15;
        
        // Pulse scale
        const pulseScale = 1 + Math.sin(anim.time * 8) * 0.1;
        meshRef.current.scale.setScalar(pulseScale * hoverScale);
        break;
        
      case "waving":
        // Waving side to side
        meshRef.current.position.y = Math.sin(anim.time * 2) * 0.05;
        meshRef.current.rotation.z = Math.sin(anim.time * 4) * 0.2;
        meshRef.current.scale.setScalar(hoverScale);
        break;
        
      case "bouncing":
        // Rubber ball bounce
        const bouncePhase = anim.time * 5;
        const bounce = Math.abs(Math.sin(bouncePhase));
        const squishFactor = 1 - (1 - bounce) * 0.3;
        
        meshRef.current.position.y = bounce * 0.35;
        meshRef.current.scale.set(
          (1 / squishFactor) * hoverScale,
          squishFactor * hoverScale,
          1
        );
        break;
    }
  });

  return (
    <mesh 
      ref={meshRef}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function MessageBubble({ message }: { message: string }) {
  return (
    <Billboard position={[0.8, 0.3, 0]}>
      <mesh>
        <planeGeometry args={[1.5, 0.6]} />
        <meshBasicMaterial color="#1a1f35" transparent opacity={0.95} />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.12}
        color="white"
        maxWidth={1.3}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
      >
        {message}
      </Text>
    </Billboard>
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
        camera={{ position: [0, 0, 2], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1} />
        <Suspense fallback={null}>
          <LeoSprite animation={animation} onClick={onClick} />
          {message && <MessageBubble message={message} />}
        </Suspense>
      </Canvas>
      
      {/* Glow effect behind */}
      <div 
        className="absolute inset-0 -z-10 rounded-full bg-accent/20 blur-xl animate-pulse"
        style={{ transform: "scale(0.8)" }}
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

  // Update message when initialMessage changes
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
    
    // Return to idle after animation
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
      {/* Message bubble outside canvas for better readability */}
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
