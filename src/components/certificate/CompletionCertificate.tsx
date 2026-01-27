import { useRef } from "react";
import { motion } from "framer-motion";
import { Download, Share2, Award, Rocket, Target, Brain, Trophy, X, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CertificateData {
  userName: string;
  completionDate: string;
  marketName: string;
  totalXP: number;
  lessonsCompleted: number;
  trainersCompleted: number;
  longestStreak: number;
  skillAreas: string[];
}

interface CompletionCertificateProps {
  data: CertificateData;
  onClose: () => void;
}

export function CompletionCertificate({ data, onClose }: CompletionCertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    try {
      // Dynamic import for html2canvas
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#0B1020',
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `aerospace-mastery-certificate-${data.completionDate}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success("Certificate downloaded!");
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast.error("Failed to download certificate");
    }
  };

  const handleShareLinkedIn = () => {
    const text = encodeURIComponent(
      `🚀 I just completed the 180-day Aerospace Industry Mastery Program!\n\n` +
      `📊 ${data.totalXP.toLocaleString()} XP earned\n` +
      `📚 ${data.lessonsCompleted} lessons completed\n` +
      `🎯 ${data.trainersCompleted} decision scenarios mastered\n` +
      `🔥 ${data.longestStreak}-day learning streak\n\n` +
      `Key skill areas: ${data.skillAreas.join(', ')}\n\n` +
      `#Aerospace #Aviation #SpaceIndustry #ProfessionalDevelopment`
    );
    
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin)}&text=${text}`,
      '_blank',
      'width=600,height=400'
    );
    
    toast.success("Opening LinkedIn share dialog...");
  };

  const handleCopyText = () => {
    const text = 
      `🚀 Aerospace Industry Mastery Certificate\n\n` +
      `Awarded to: ${data.userName}\n` +
      `Program: 180-Day ${data.marketName} Mastery\n` +
      `Completed: ${data.completionDate}\n\n` +
      `Achievements:\n` +
      `• ${data.totalXP.toLocaleString()} XP earned\n` +
      `• ${data.lessonsCompleted} lessons completed\n` +
      `• ${data.trainersCompleted} decision scenarios\n` +
      `• ${data.longestStreak}-day learning streak\n\n` +
      `Skill Areas: ${data.skillAreas.join(', ')}`;
    
    navigator.clipboard.writeText(text);
    toast.success("Certificate text copied to clipboard!");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-bg-2 text-text-muted hover:text-text-primary transition-colors"
        >
          <X size={20} />
        </button>

        {/* Certificate */}
        <div
          ref={certificateRef}
          className="bg-gradient-to-br from-bg-0 via-bg-1 to-bg-2 rounded-2xl border-2 border-accent/30 p-8 relative overflow-hidden"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_hsl(var(--accent)/0.1),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_hsl(var(--primary)/0.1),_transparent_50%)]" />

          {/* Header */}
          <div className="text-center mb-6 relative">
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                <Award className="w-8 h-8 text-accent" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-wide">
              CERTIFICATE OF COMPLETION
            </h1>
            <p className="text-caption text-text-muted mt-1 tracking-widest uppercase">
              Aerospace Industry Mastery Program
            </p>
          </div>

          {/* Recipient */}
          <div className="text-center mb-6">
            <p className="text-caption text-text-muted">This certifies that</p>
            <h2 className="text-3xl font-bold text-accent mt-2 mb-1">
              {data.userName}
            </h2>
            <p className="text-caption text-text-muted">
              has successfully completed the 180-day
            </p>
            <p className="text-h3 text-text-primary font-semibold">
              {data.marketName} Industry Mastery Program
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-bg-0/50 rounded-xl p-3 text-center border border-border">
              <Rocket className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-xl font-bold text-text-primary">{data.totalXP.toLocaleString()}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">XP Earned</p>
            </div>
            <div className="bg-bg-0/50 rounded-xl p-3 text-center border border-border">
              <Brain className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-text-primary">{data.lessonsCompleted}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Lessons</p>
            </div>
            <div className="bg-bg-0/50 rounded-xl p-3 text-center border border-border">
              <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-text-primary">{data.trainersCompleted}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Scenarios</p>
            </div>
            <div className="bg-bg-0/50 rounded-xl p-3 text-center border border-border">
              <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-text-primary">{data.longestStreak}</p>
              <p className="text-[10px] text-text-muted uppercase tracking-wide">Day Streak</p>
            </div>
          </div>

          {/* Skill Areas */}
          <div className="mb-6">
            <p className="text-caption text-text-muted text-center mb-2">Demonstrated proficiency in:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {data.skillAreas.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 rounded-full text-caption bg-accent/10 text-accent border border-accent/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center pt-4 border-t border-border">
            <p className="text-caption text-text-muted">
              Issued on {data.completionDate}
            </p>
            <p className="text-[10px] text-text-muted mt-1">
              Verified by Aerospace Learning Platform
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download size={16} />
            Download
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleShareLinkedIn}
            className="gap-2 bg-[#0077B5] hover:bg-[#006699]"
          >
            <Linkedin size={16} />
            Share on LinkedIn
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyText}
            className="gap-2"
          >
            <Share2 size={16} />
            Copy Text
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
