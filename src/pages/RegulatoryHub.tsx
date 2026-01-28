import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { ChevronRight, FileCheck, Scale, ShieldCheck, Clock, AlertTriangle, CheckCircle2, ExternalLink, Brain, FlaskConical, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import mentorSophia from "@/assets/mentors/mentor-sophia.png";

interface PathwayStep {
  title: string;
  duration: string;
  description: string;
  tips: string[];
}

interface RegulatoryPathway {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  timeline: string;
  costRange: string;
  steps: PathwayStep[];
  examples: string[];
}

const FDA_PATHWAYS: RegulatoryPathway[] = [
  {
    id: "510k",
    name: "510(k) Clearance",
    description: "For devices substantially equivalent to existing approved devices. Most common pathway for neurotech.",
    icon: <FileCheck size={20} />,
    color: "text-blue-400",
    timeline: "3-6 months",
    costRange: "$50K - $150K",
    steps: [
      {
        title: "Identify Predicate Device",
        duration: "2-4 weeks",
        description: "Find an FDA-cleared device with similar intended use and technological characteristics.",
        tips: ["Search FDA 510(k) database", "Consider multiple predicates", "Document similarities clearly"],
      },
      {
        title: "Prepare Submission",
        duration: "2-3 months",
        description: "Compile device description, performance testing, and comparison to predicate.",
        tips: ["Follow FDA guidance documents", "Include risk analysis", "Prepare biocompatibility data if applicable"],
      },
      {
        title: "FDA Review",
        duration: "90 days (statutory)",
        description: "FDA reviews submission; may request Additional Information (AI).",
        tips: ["Respond to AI requests quickly", "Track review timeline", "Prepare for potential meeting"],
      },
      {
        title: "Clearance Decision",
        duration: "1-2 weeks",
        description: "FDA issues Substantially Equivalent (SE) or Not Substantially Equivalent (NSE) decision.",
        tips: ["Plan manufacturing scale-up", "Prepare marketing materials", "Register establishment"],
      },
    ],
    examples: ["Consumer EEG headbands", "Neurofeedback systems", "TMS accessories"],
  },
  {
    id: "denovo",
    name: "De Novo Classification",
    description: "For novel, low-to-moderate risk devices without a predicate. Creates new classification.",
    icon: <Scale size={20} />,
    color: "text-purple-400",
    timeline: "6-12 months",
    costRange: "$150K - $400K",
    steps: [
      {
        title: "Pre-Submission Meeting",
        duration: "3-4 months",
        description: "Request Q-Sub meeting with FDA to discuss classification and testing requirements.",
        tips: ["Prepare detailed device description", "Propose risk classification", "Identify key questions"],
      },
      {
        title: "Clinical Evidence",
        duration: "3-6 months",
        description: "Conduct bench testing, possibly clinical studies depending on risk profile.",
        tips: ["Design studies per FDA feedback", "Consider IRB-approved trials", "Document adverse events"],
      },
      {
        title: "De Novo Request",
        duration: "1-2 months",
        description: "Submit comprehensive request with all evidence and proposed controls.",
        tips: ["Include risk-benefit analysis", "Propose special controls", "Reference similar devices"],
      },
      {
        title: "FDA Review & Grant",
        duration: "150 days (goal)",
        description: "FDA reviews and may grant De Novo, creating new device classification.",
        tips: ["You become the predicate", "Plan for post-market requirements", "Consider IP implications"],
      },
    ],
    examples: ["Novel neurostimulation devices", "AI-powered diagnostic tools", "Closed-loop brain interfaces"],
  },
  {
    id: "pma",
    name: "PMA (Pre-Market Approval)",
    description: "For Class III high-risk devices. Most rigorous pathway requiring clinical trials.",
    icon: <ShieldCheck size={20} />,
    color: "text-amber-400",
    timeline: "2-5 years",
    costRange: "$5M - $50M+",
    steps: [
      {
        title: "Pre-IDE Planning",
        duration: "6-12 months",
        description: "Prepare Investigational Device Exemption application for clinical trials.",
        tips: ["Define primary endpoints", "Power analysis for sample size", "Identify clinical sites"],
      },
      {
        title: "IDE Approval & Trial",
        duration: "1-3 years",
        description: "Conduct pivotal clinical trial with FDA oversight.",
        tips: ["Enroll diverse patient population", "Maintain GCP compliance", "Track all adverse events"],
      },
      {
        title: "PMA Submission",
        duration: "3-6 months",
        description: "Compile comprehensive application with all clinical, manufacturing, and safety data.",
        tips: ["Hire regulatory consultants", "Prepare executive summary", "Include all raw data"],
      },
      {
        title: "FDA Review & Panel",
        duration: "180 days + panel",
        description: "FDA reviews; may convene advisory panel for high-profile devices.",
        tips: ["Prepare panel presentation", "Anticipate questions", "Engage with patient advocates"],
      },
    ],
    examples: ["Deep brain stimulators", "Implantable BCIs", "Closed-loop seizure devices"],
  },
];

const IRB_ESSENTIALS = [
  {
    title: "Informed Consent",
    description: "Participants must understand risks, benefits, and alternatives. Use plain language.",
    icon: <Users size={18} />,
  },
  {
    title: "Risk Minimization",
    description: "Design studies to minimize risks. Justify any remaining risks with potential benefits.",
    icon: <ShieldCheck size={18} />,
  },
  {
    title: "Vulnerable Populations",
    description: "Extra protections for children, prisoners, pregnant women, and cognitively impaired.",
    icon: <AlertTriangle size={18} />,
  },
  {
    title: "Data Privacy",
    description: "Protect participant data. Consider HIPAA, GDPR, and brain data privacy concerns.",
    icon: <FileCheck size={18} />,
  },
];

export default function RegulatoryHub() {
  const [selectedPathway, setSelectedPathway] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const activePathway = FDA_PATHWAYS.find(p => p.id === selectedPathway);

  return (
    <AppLayout>
      <div className="screen-padding pt-safe pb-28">
        {/* Header with Sophia */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 py-4 mb-4"
        >
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-accent/50 shadow-lg">
            <img src={mentorSophia} alt="Sophia" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-text-primary">Research-to-Clinic Pipeline</h1>
            <p className="text-sm text-text-muted">Navigate FDA & IRB pathways with confidence</p>
          </div>
        </motion.div>

        {/* Sophia's Tip */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-5"
        >
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-accent">Sophia's Tip:</span> The regulatory pathway you choose will define your timeline, budget, and fundraising strategy. Understanding these early saves years of pivots!
          </p>
        </motion.div>

        {/* FDA Pathways */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <h2 className="text-caption font-medium uppercase tracking-wider text-text-muted mb-3">
            FDA Device Pathways
          </h2>
          <div className="space-y-3">
            {FDA_PATHWAYS.map((pathway, idx) => (
              <motion.button
                key={pathway.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + idx * 0.05 }}
                onClick={() => setSelectedPathway(selectedPathway === pathway.id ? null : pathway.id)}
                className={cn(
                  "w-full p-4 rounded-xl text-left transition-all",
                  selectedPathway === pathway.id
                    ? "bg-bg-2 border-2 border-accent"
                    : "bg-bg-2/50 border border-border hover:border-text-muted"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-bg-1", pathway.color)}>
                      {pathway.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">{pathway.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {pathway.timeline}
                        </span>
                        <span>{pathway.costRange}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    size={18}
                    className={cn(
                      "text-text-muted transition-transform",
                      selectedPathway === pathway.id && "rotate-90"
                    )}
                  />
                </div>
                <p className="text-sm text-text-secondary">{pathway.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Expanded Pathway Details */}
        <AnimatePresence>
          {activePathway && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-bg-2 rounded-xl p-4 border border-border">
                <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <FlaskConical size={18} className="text-accent" />
                  Step-by-Step Process
                </h3>
                <div className="space-y-3">
                  {activePathway.steps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <button
                        onClick={() => setExpandedStep(expandedStep === idx ? null : idx)}
                        className="w-full text-left"
                      >
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-1 border border-border">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-semibold text-sm">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-text-primary text-sm">{step.title}</p>
                            <p className="text-xs text-text-muted">{step.duration}</p>
                          </div>
                          <ChevronRight
                            size={16}
                            className={cn(
                              "text-text-muted transition-transform",
                              expandedStep === idx && "rotate-90"
                            )}
                          />
                        </div>
                      </button>
                      <AnimatePresence>
                        {expandedStep === idx && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="ml-11 mt-2 p-3 rounded-lg bg-bg-1/50 border-l-2 border-accent">
                              <p className="text-sm text-text-secondary mb-3">{step.description}</p>
                              <div className="space-y-1.5">
                                {step.tips.map((tip, tipIdx) => (
                                  <div key={tipIdx} className="flex items-start gap-2 text-xs">
                                    <CheckCircle2 size={14} className="text-success mt-0.5 flex-shrink-0" />
                                    <span className="text-text-muted">{tip}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>

                {/* Examples */}
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-text-muted mb-2">Example Devices:</p>
                  <div className="flex flex-wrap gap-2">
                    {activePathway.examples.map((ex, idx) => (
                      <span key={idx} className="chip text-xs">
                        {ex}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* IRB Essentials */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <h2 className="text-caption font-medium uppercase tracking-wider text-text-muted mb-3">
            IRB Essentials
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {IRB_ESSENTIALS.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 + idx * 0.05 }}
                className="p-3 rounded-xl bg-bg-2/50 border border-border"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2">
                  {item.icon}
                </div>
                <h3 className="font-medium text-text-primary text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Resources Link */}
        <motion.a
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          href="https://www.fda.gov/medical-devices"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20"
        >
          <div className="flex items-center gap-3">
            <Brain size={24} className="text-accent" />
            <div>
              <p className="font-medium text-text-primary">FDA Medical Devices</p>
              <p className="text-xs text-text-muted">Official guidance documents</p>
            </div>
          </div>
          <ExternalLink size={18} className="text-accent" />
        </motion.a>
      </div>
    </AppLayout>
  );
}
