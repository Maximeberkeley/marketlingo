import { useState } from "react";
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { Trash2, Newspaper, BookOpen, Brain } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { HighlightedText } from "./HighlightedText";

interface NoteEntry {
  id: string;
  content: string;
  linked_label: string | null;
  created_at: string;
  stack_id: string | null;
  slide_id: string | null;
}

interface SwipeableNoteCardProps {
  note: NoteEntry;
  onDelete: (id: string) => void;
  index: number;
  searchTerms?: string[];
}

const typeConfig: Record<string, { icon: typeof Newspaper; color: string; bg: string }> = {
  news: { icon: Newspaper, color: "text-blue-400", bg: "bg-blue-500/10" },
  lesson: { icon: BookOpen, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  trainer: { icon: Brain, color: "text-amber-400", bg: "bg-amber-500/10" },
};

function getLinkedType(label: string | null): "news" | "lesson" | "trainer" {
  if (!label) return "lesson";
  const lower = label.toLowerCase();
  if (lower.includes("news") || lower.includes("daily")) return "news";
  if (lower.includes("trainer")) return "trainer";
  return "lesson";
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const DELETE_THRESHOLD = -120;

export function SwipeableNoteCard({ note, onDelete, index, searchTerms = [] }: SwipeableNoteCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [0, -60], [0, 1]);
  const deleteScale = useTransform(x, [-60, DELETE_THRESHOLD], [0.8, 1]);
  const cardOpacity = useTransform(x, [DELETE_THRESHOLD, DELETE_THRESHOLD - 50], [1, 0]);

  const linkedType = getLinkedType(note.linked_label);
  const config = typeConfig[linkedType];
  const TypeIcon = config.icon;

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < DELETE_THRESHOLD) setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    setIsDeleting(true);
    setShowConfirm(false);
    setTimeout(() => onDelete(note.id), 200);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    x.set(0);
  };

  if (isDeleting) {
    return (
      <motion.div
        initial={{ opacity: 1, height: "auto" }}
        animate={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="overflow-hidden"
      />
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 + index * 0.04 }}
        className="relative overflow-hidden rounded-2xl"
      >
        {/* Delete Background */}
        <motion.div
          style={{ opacity: deleteOpacity }}
          className="absolute inset-0 bg-destructive/15 rounded-2xl flex items-center justify-end pr-5"
        >
          <motion.div style={{ scale: deleteScale }} className="flex items-center gap-1.5 text-destructive">
            <Trash2 size={18} />
            <span className="text-xs font-medium">Delete</span>
          </motion.div>
        </motion.div>

        {/* Card */}
        <motion.div
          drag="x"
          dragConstraints={{ left: DELETE_THRESHOLD, right: 0 }}
          dragElastic={{ left: 0.1, right: 0 }}
          onDragEnd={handleDragEnd}
          style={{ x, opacity: cardOpacity }}
          className="bg-bg-1 border border-border rounded-2xl p-4 cursor-grab active:cursor-grabbing relative"
        >
          {/* Type indicator line */}
          <div className={cn("absolute left-0 top-3 bottom-3 w-[3px] rounded-full", config.bg.replace("/10", "/40"))} />

          <div className="pl-3">
            <p className="text-[13px] leading-relaxed text-text-primary line-clamp-3 mb-3">
              <HighlightedText text={note.content} terms={searchTerms} maxLines={3} />
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium", config.bg, config.color)}>
                  <TypeIcon size={11} />
                  {note.linked_label || "Note"}
                </span>
                <span className="text-[11px] text-text-muted">
                  {formatTimestamp(note.created_at)}
                </span>
              </div>

              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onClick={() => setShowConfirm(true)}
                className="p-1.5 rounded-lg hover:bg-bg-2 active:bg-bg-2 transition-colors touch-manipulation"
              >
                <Trash2 size={14} className="text-text-muted" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-bg-1 border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-primary">Delete Note</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete} className="bg-bg-2 border-border text-text-primary hover:bg-bg-2/80">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
