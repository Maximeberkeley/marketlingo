import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Rocket, BookOpen, Gamepad2, Newspaper, Target, TrendingUp,
  Trophy, ChevronRight, Sparkles, Shield, Zap, GraduationCap,
  Check, ArrowRight, Globe, Users, Brain, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
  })
};

const markets = [
  { name: "Aerospace & Defense", icon: "🚀", color: "from-blue-500 to-indigo-600" },
  { name: "Electric Vehicles", icon: "⚡", color: "from-emerald-500 to-teal-600" },
  { name: "Cybersecurity", icon: "🛡️", color: "from-red-500 to-rose-600" },
  { name: "Neuroscience", icon: "🧠", color: "from-purple-500 to-violet-600" },
  { name: "AgTech", icon: "🌾", color: "from-lime-500 to-green-600" },
  { name: "Quantum Computing", icon: "⚛️", color: "from-cyan-500 to-blue-600" },
  { name: "Biotech & Pharma", icon: "🧬", color: "from-pink-500 to-fuchsia-600" },
  { name: "Fintech", icon: "💳", color: "from-amber-500 to-orange-600" },
  { name: "Space Economy", icon: "🛰️", color: "from-indigo-500 to-purple-600" },
  { name: "Clean Energy", icon: "☀️", color: "from-yellow-500 to-amber-600" },
  { name: "Robotics & AI", icon: "🤖", color: "from-slate-500 to-zinc-600" },
  { name: "Semiconductors", icon: "💡", color: "from-sky-500 to-blue-600" },
];

const features = [
  {
    icon: BookOpen,
    title: "Daily Micro-Lessons",
    desc: "6 swipeable slides per day, written like a brilliant professor — not a textbook.",
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    icon: Gamepad2,
    title: "Games & Drills",
    desc: "Flashcards, word match, true/false — make industry jargon stick through play.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
  {
    icon: Newspaper,
    title: "Real-Time News",
    desc: "Curated daily industry news with AI summaries. Stay current from day one.",
    color: "text-amber-500",
    bg: "bg-amber-500/10"
  },
  {
    icon: Target,
    title: "Interview Lab",
    desc: "Mock interviews with AI feedback. Behavioral, technical, and case study prep.",
    color: "text-red-500",
    bg: "bg-red-500/10"
  },
  {
    icon: TrendingUp,
    title: "Investment Lab",
    desc: "Paper trading, thesis building, portfolio construction — learn to analyze like a pro.",
    color: "text-violet-500",
    bg: "bg-violet-500/10"
  },
  {
    icon: Trophy,
    title: "Streaks & Leaderboards",
    desc: "XP, levels, achievements, and friends. Stay motivated with daily streaks.",
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
];

const steps = [
  {
    num: "01",
    title: "Pick your industry",
    desc: "Choose from 12+ markets — aerospace, EVs, biotech, and more.",
    icon: Globe,
  },
  {
    num: "02",
    title: "Learn 5 min/day",
    desc: "Swipe through lessons, play games, and read curated news.",
    icon: Zap,
  },
  {
    num: "03",
    title: "Become an insider",
    desc: "Interview-ready in 6 months. Sound like you've been in the industry for years.",
    icon: GraduationCap,
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-foreground">MarketLingo</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#markets" className="hover:text-foreground transition-colors">Markets</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Sign in
            </Button>
            <Button size="sm" onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <Sparkles className="w-4 h-4" />
              Master any industry in 6 months
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6"
            >
              The{" "}
              <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                Duolingo
              </span>{" "}
              for business knowledge
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            >
              Daily bite-sized lessons, real-world news, and gamified practice.
              Sound like an industry insider — whether you're interviewing, investing, or just curious.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base rounded-2xl shadow-lg"
              >
                Start Learning — Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-6 text-base rounded-2xl"
              >
                See how it works
              </Button>
            </motion.div>
          </div>

          {/* Screenshot mockups */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 flex justify-center gap-4 px-4"
          >
            {["screenshot-1-home.png", "screenshot-2-trainer.png", "screenshot-3-roadmap.png"].map((img, i) => (
              <div
                key={img}
                className={`w-48 sm:w-56 md:w-64 rounded-3xl overflow-hidden shadow-2xl border border-border/50 
                  ${i === 1 ? "scale-110 z-10" : "opacity-80 hidden sm:block"}`}
              >
                <img
                  src={`/appstore/${img}`}
                  alt={`MarketLingo screenshot ${i + 1}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-8 border-y border-border bg-secondary/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-center gap-8 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>12+ Industries</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>180 Days of Content</span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            <span>AI-Powered Feedback</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span>Harvard + Duolingo Approach</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              Three steps to insider status
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg max-w-xl mx-auto">
              No boring textbooks. No 40-hour courses. Just 5 minutes a day.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i + 1}
                className="relative p-8 rounded-3xl bg-card border border-border hover:border-primary/30 transition-colors group"
              >
                <div className="text-5xl font-black text-primary/15 mb-4 group-hover:text-primary/25 transition-colors">
                  {step.num}
                </div>
                <step.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 sm:px-6 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to master an industry
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Lessons, games, news, mock interviews, investment simulations — all in one app.
            </motion.p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${feat.bg} flex items-center justify-center mb-4`}>
                  <feat.icon className={`w-6 h-6 ${feat.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feat.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets */}
      <section id="markets" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              12+ industries. One app.
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Each market has 180 days of curated content — lessons, news, drills, and more.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            {markets.map((m, i) => (
              <motion.div
                key={m.name}
                variants={fadeUp}
                custom={i * 0.5}
                className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:scale-105 cursor-default text-center"
              >
                <div className="text-3xl mb-2">{m.icon}</div>
                <p className="text-sm font-medium">{m.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Screenshot gallery */}
      <section className="py-24 px-4 sm:px-6 bg-secondary/20">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              Designed for your pocket
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg max-w-xl mx-auto">
              A beautiful, intuitive mobile experience that makes learning addictive.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex justify-center gap-6 overflow-x-auto pb-4"
          >
            {[
              "screenshot-1-home.png",
              "screenshot-4-news.png",
              "screenshot-2-trainer.png",
              "screenshot-5-progress.png",
              "screenshot-3-roadmap.png",
            ].map((img, i) => (
              <motion.div
                key={img}
                variants={fadeUp}
                custom={i}
                className="flex-shrink-0 w-44 sm:w-52 rounded-2xl overflow-hidden shadow-xl border border-border/50"
              >
                <img
                  src={`/appstore/${img}`}
                  alt={`App screenshot ${i + 1}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl sm:text-4xl font-bold mb-4">
              Start free. Go Pro when ready.
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg max-w-xl mx-auto">
              Everything you need to get started — for free. Unlock the full experience with Pro.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="p-8 rounded-3xl bg-card border border-border"
            >
              <h3 className="text-xl font-bold mb-1">Free</h3>
              <p className="text-muted-foreground text-sm mb-6">Get started with the basics</p>
              <div className="text-4xl font-extrabold mb-8">
                $0<span className="text-lg font-normal text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "1 industry market",
                  "Daily micro-lessons",
                  "Basic games & drills",
                  "News feed",
                  "Streaks & XP",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full rounded-xl py-5"
                onClick={() => navigate("/auth")}
              >
                Get Started
              </Button>
            </motion.div>

            {/* Pro */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
              className="p-8 rounded-3xl bg-card border-2 border-primary relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-bl-xl">
                POPULAR
              </div>
              <h3 className="text-xl font-bold mb-1">Pro</h3>
              <p className="text-muted-foreground text-sm mb-6">Full insider experience</p>
              <div className="text-4xl font-extrabold mb-8">
                $9.99<span className="text-lg font-normal text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "All 12+ industry markets",
                  "Unlimited lessons & drills",
                  "Interview Lab with AI feedback",
                  "Investment Lab & simulations",
                  "AI mentor chat (Leo)",
                  "Regulatory hub access",
                  "Priority content updates",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                className="w-full rounded-xl py-5 bg-primary hover:bg-primary/90"
                onClick={() => navigate("/auth")}
              >
                Start 7-Day Free Trial
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="max-w-3xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to become an industry insider?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Join thousands of professionals, students, and curious minds mastering new industries — 5 minutes at a time.
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-base rounded-2xl shadow-lg"
          >
            Start Learning — It's Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Rocket className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-foreground">MarketLingo</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="mailto:hello@marketlingo.app" className="hover:text-foreground transition-colors">Contact</a>
              <span>•</span>
              <span>© {new Date().getFullYear()} MarketLingo. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
