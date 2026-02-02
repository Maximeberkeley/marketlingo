import { useEffect, useMemo, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import leoSticker from "@/assets/leo-sticker.png"; // <-- your exact PNG

type LeoAnim = "idle" | "thinking" | "success" | "failure" | "waving" | "celebrating" | "urgent" | "sleeping";

type LeoVariant = "normal" | "sick" | "happy" | "sleepy";

interface LeoStickerProps {
  size?: number; // px
  animation?: LeoAnim;
  variant?: LeoVariant;
  className?: string;
  onClick?: () => void;
}

/**
 * LeoSticker
 * - Keeps the exact sticker look (PNG)
 * - Adds Duo-style "alive" motion + blink overlay
 * - NOTE: tail/legs can't move independently unless you provide layered assets.
 */
export function LeoSticker({
  size = 160,
  animation = "idle",
  variant = "normal",
  className,
  onClick,
}: LeoStickerProps) {
  const controls = useAnimation();

  // Natural blink scheduler (2–4s)
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let mounted = true;

    const schedule = () => {
      const t = 1800 + Math.random() * 2200;
      setTimeout(() => {
        if (!mounted) return;
        setBlink(true);
        setTimeout(() => mounted && setBlink(false), 120);
        schedule();
      }, t);
    };

    schedule();
    return () => {
      mounted = false;
    };
  }, []);

  // For “mischievous” vibe, we slightly tilt + push a micro-smirk overlay
  const mischievous = useMemo(() => animation === "idle" || animation === "thinking", [animation]);

  // Drive motion by state
  useEffect(() => {
    const run = async () => {
      // stop current
      controls.stop();

      if (animation === "idle") {
        // subtle breathing + tiny bob like Duo
        await controls.start({
          y: [0, -2, 0],
          rotate: [0, -1.2, 0, 1.2, 0],
          scale: [1, 1.01, 1],
          transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
        });
        return;
      }

      if (animation === "thinking") {
        await controls.start({
          rotate: [0, -5, 0, 5, 0],
          y: [0, -2, 0],
          transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
        });
        return;
      }

      if (animation === "urgent") {
        await controls.start({
          scale: [1, 1.04, 1],
          transition: { duration: 0.35, repeat: Infinity, ease: "easeInOut" },
        });
        return;
      }

      if (animation === "success") {
        await controls.start({
          y: [0, -18, 0, -10, 0],
          rotate: [0, -2, 2, 0],
          scale: [1, 1.06, 0.98, 1.03, 1],
          transition: { duration: 0.9, times: [0, 0.25, 0.5, 0.75, 1] },
        });
        controls.start({
          y: [0, -2, 0],
          rotate: [0, -1.2, 0, 1.2, 0],
          transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
        });
        return;
      }

      if (animation === "failure") {
        await controls.start({
          y: [0, 4, 0],
          rotate: [0, -2, 0],
          scale: [1, 0.98, 1],
          transition: { duration: 0.6, ease: "easeInOut" },
        });
        controls.start({
          y: [0, -2, 0],
          rotate: [0, -1.2, 0, 1.2, 0],
          transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
        });
        return;
      }

      if (animation === "celebrating") {
        await controls.start({
          y: [0, -16, 0, -16, 0],
          rotate: [-4, 4, -4, 4, 0],
          scale: [1, 1.06, 1, 1.06, 1],
          transition: { duration: 1.2, ease: "easeInOut" },
        });
        controls.start({
          y: [0, -2, 0],
          rotate: [0, -1.2, 0, 1.2, 0],
          transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
        });
        return;
      }

      if (animation === "sleeping") {
        await controls.start({
          y: [0, 2, 0],
          rotate: [-2, -1, -2],
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        });
        return;
      }

      // fallback
      controls.start({
        y: [0, -2, 0],
        transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
      });
    };

    run();
  }, [animation, controls]);

  // Small “mood filters” (optional)
  const moodFilter =
    variant === "sick"
      ? "saturate(0.75) brightness(0.95)"
      : variant === "sleepy"
        ? "saturate(0.9) brightness(0.98)"
        : variant === "happy"
          ? "saturate(1.05) brightness(1.02)"
          : "none";

  return (
    <div className={className} style={{ width: size, height: size, position: "relative" }} onClick={onClick}>
      {/* Whole-body motion */}
      <motion.div
        animate={controls}
        style={{
          width: "100%",
          height: "100%",
          transformOrigin: "50% 70%", // makes bounces feel “grounded”
          filter: `drop-shadow(0 8px 16px rgba(0,0,0,0.22)) ${moodFilter}`,
          userSelect: "none",
          cursor: onClick ? "pointer" : "default",
        }}
      >
        <img
          src={leoSticker}
          alt="Leo"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </motion.div>

      {/* Blink overlay (fake eyelids) — positioned for this sticker */}
      {/* Adjust these percentages once and you’re done. */}
      <div
        style={{
          position: "absolute",
          left: "0%",
          top: "0%",
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {/* Left eye lid */}
        <motion.div
          animate={{
            scaleY: blink || animation === "sleeping" ? 1 : 0,
            opacity: blink || animation === "sleeping" ? 1 : 0,
          }}
          transition={{ duration: 0.12 }}
          style={{
            position: "absolute",
            left: "39.5%",
            top: "39.5%",
            width: "14%",
            height: "6.5%",
            background: "rgba(0,0,0,0.55)",
            borderRadius: "999px",
            transformOrigin: "50% 50%",
          }}
        />
        {/* Right eye lid */}
        <motion.div
          animate={{
            scaleY: blink || animation === "sleeping" ? 1 : 0,
            opacity: blink || animation === "sleeping" ? 1 : 0,
          }}
          transition={{ duration: 0.12 }}
          style={{
            position: "absolute",
            left: "57%",
            top: "41%",
            width: "14%",
            height: "6.5%",
            background: "rgba(0,0,0,0.55)",
            borderRadius: "999px",
            transformOrigin: "50% 50%",
          }}
        />

        {/* Micro-smirk enhancer (subtle) */}
        <motion.div
          animate={{
            opacity: mischievous && animation !== "failure" ? 0.45 : 0,
            y: mischievous ? [0, -0.5, 0] : 0,
          }}
          transition={{ duration: 2.4, repeat: mischievous ? Infinity : 0, ease: "easeInOut" }}
          style={{
            position: "absolute",
            left: "47%",
            top: "58.5%",
            width: "10%",
            height: "4%",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.25)",
            filter: "blur(0.5px)",
          }}
        />
      </div>
    </div>
  );
}
