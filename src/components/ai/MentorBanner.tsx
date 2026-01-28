import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { Mentor, mentors } from "@/data/mentors";
import { MentorAvatar } from "./MentorAvatar";
import { MentorChatOverlay } from "./MentorChatOverlay";

interface MentorBannerProps {
  context?: string;
  marketId?: string;
}

export function MentorBanner({ context, marketId }: MentorBannerProps) {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-card bg-gradient-to-r from-accent/20 via-accent/10 to-transparent border border-accent/30"
      >
        <div className="flex items-center gap-3">
          {/* Mentor Avatars Stack */}
          <div className="flex -space-x-3">
            {mentors.map((mentor, index) => (
              <motion.div
                key={mentor.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ zIndex: mentors.length - index }}
              >
                <MentorAvatar
                  mentor={mentor}
                  size="md"
                  showPulse={index === 0}
                  onClick={() => setSelectedMentor(mentor)}
                />
              </motion.div>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-body font-medium text-text-primary">Ask our mentors</p>
            <p className="text-caption text-text-secondary truncate">
              Get instant answers about aerospace
            </p>
          </div>

          <button
            onClick={() => setSelectedMentor(mentors[0])}
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center hover:bg-accent/90 transition-colors"
          >
            <MessageCircle size={18} className="text-white" />
          </button>
        </div>
      </motion.div>

      <MentorChatOverlay
        mentor={selectedMentor}
        onClose={() => setSelectedMentor(null)}
        context={context}
        marketId={marketId}
      />
    </>
  );
}
