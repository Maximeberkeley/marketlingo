import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useOnboardingRouter } from "@/hooks/useOnboardingRouter";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2, Zap } from "lucide-react";
import { z } from "zod";
import { LeoCharacter } from "@/components/mascot/LeoStateMachine";
import { scrollInputIntoView } from "@/hooks/useKeyboardAware";
import { DemoLesson } from "@/components/demo/DemoLesson";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
type AuthMode = "options" | "email-login" | "email-signup";

export default function AuthPage() {
  const [showDemo, setShowDemo] = useState(false);
  const { user, loading, signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const { routeToCorrectScreen } = useOnboardingRouter();
  const [mode, setMode] = useState<AuthMode>("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      routeToCorrectScreen(user.id);
    }
  }, [user, loading, routeToCorrectScreen]);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) toast.error(error.message || "Failed to sign in with Google");
  };

  const handleAppleSignIn = async () => {
    const { error } = await signInWithApple();
    if (error) toast.error(error.message || "Failed to sign in with Apple");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.errors[0].message);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      if (mode === "email-signup") {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error("This email is already registered. Please sign in instead.");
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success("Account created! Redirecting...");
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error("Invalid email or password. Please try again.");
          } else {
            toast.error(error.message);
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-bg-0 to-bg-1 state-container">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  // Demo lesson overlay — full screen, no auth required
  if (showDemo) {
    return (
      <AnimatePresence>
        <DemoLesson
          onSignUp={() => { setShowDemo(false); setMode("email-signup"); }}
          onClose={() => setShowDemo(false)}
        />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-gradient-to-b from-bg-0 to-bg-1 overflow-x-hidden overflow-y-auto keyboard-aware">
      <AnimatePresence mode="wait">
        {mode === "options" ? (
          <motion.div
            key="options"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm flex flex-col items-center"
          >
            {/* Leo Mascot */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mb-5 flex flex-col items-center justify-center"
            >
              <LeoCharacter size="xl" animation="idle" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-h1 text-text-primary text-center mb-2"
            >
              MarketLingo
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-body text-text-secondary text-center mb-6 max-w-xs"
            >
              Become fluent in one market in 6 months.
            </motion.p>

            {/* ── "Try a Free Lesson" shimmer CTA ── */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="w-full mb-5"
            >
              <button
                onClick={() => setShowDemo(true)}
                className="w-full relative overflow-hidden rounded-2xl border-2 border-accent/40 bg-gradient-to-r from-accent/15 to-purple-600/10 p-4 text-left transition-all hover:border-accent/60 active:scale-[0.98]"
              >
                {/* Shimmer sweep */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1.2 }}
                />
                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Zap size={20} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-semibold text-text-primary">Try a free lesson now</p>
                    <p className="text-caption text-text-muted">AI market · 4 min · No signup needed</p>
                  </div>
                  <span className="chip bg-accent/20 text-accent border-accent/30 text-[10px] px-2 py-0.5 flex-shrink-0">FREE</span>
                </div>
              </button>
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="w-full flex items-center gap-3 mb-5"
            >
              <div className="flex-1 h-px bg-border" />
              <span className="text-caption text-text-muted">or sign in</span>
              <div className="flex-1 h-px bg-border" />
            </motion.div>

            {/* Auth Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.4 }}
              className="w-full space-y-3"
            >
              <Button variant="social" size="full" onClick={handleAppleSignIn}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </Button>

              <Button variant="social" size="full" onClick={handleGoogleSignIn}>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <Button variant="social" size="full" onClick={() => setMode("email-login")}>
                <Mail className="w-5 h-5 mr-2" />
                Continue with Email
              </Button>
            </motion.div>

            {/* Terms */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="text-caption text-text-muted text-center mt-8"
            >
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="email-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
          >
            {/* Back Button */}
            <button
              onClick={() => setMode("options")}
              className="flex items-center gap-2 text-text-secondary mb-8 hover:text-text-primary transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="text-body">Back</span>
            </button>

            {/* Title */}
            <h1 className="text-h1 text-text-primary mb-2">
              {mode === "email-login" ? "Welcome back" : "Create account"}
            </h1>
            <p className="text-body text-text-secondary mb-8">
              {mode === "email-login" ? "Sign in to continue your journey" : "Start your 6-month market mastery"}
            </p>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="text-caption text-text-muted block mb-2">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-bg-1 border-border text-text-primary placeholder:text-text-muted"
                  required
                  onFocus={(e) => scrollInputIntoView(e.target)}
                />
              </div>

              <div>
                <label className="text-caption text-text-muted block mb-2">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-bg-1 border-border text-text-primary placeholder:text-text-muted"
                  required
                  minLength={6}
                  onFocus={(e) => scrollInputIntoView(e.target)}
                />
              </div>

              <Button type="submit" size="full" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                {mode === "email-login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            {/* Toggle */}
            <p className="text-center text-body text-text-secondary mt-6">
              {mode === "email-login" ? (
                <>
                  Don't have an account?{" "}
                  <button onClick={() => setMode("email-signup")} className="text-primary hover:underline">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => setMode("email-login")} className="text-primary hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
