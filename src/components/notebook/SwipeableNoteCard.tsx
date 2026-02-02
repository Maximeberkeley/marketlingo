import { useState, useRef } from "react";
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
}

const typeIcons: Record<string, React.ReactNode> = {
  news: <Newspaper size={14} className="text-blue-400" />,
  lesson: <BookOpen size={14} className="text-green-400" />,
  trainer: <Brain size={14} className="text-amber-400" />,
};

const typeColors: Record<string, string> = {
  news: "bg-blue-500/20 text-blue-400",
  lesson: "bg-green-500/20 text-green-400",
  trainer: "bg-amber-500/20 text-amber-400",
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
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -150;

export function SwipeableNoteCard({ note, onDelete, index }: SwipeableNoteCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const constraintsRef = useRef(null);
  
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const deleteScale = useTransform(x, [SWIPE_THRESHOLD, DELETE_THRESHOLD], [0.8, 1]);
  const cardOpacity = useTransform(x, [DELETE_THRESHOLD, DELETE_THRESHOLD - 50], [1, 0]);
  
  const linkedType = getLinkedType(note.linked_label);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < DELETE_THRESHOLD) {
      // Full swipe - show confirmation
      setShowConfirm(true);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setShowConfirm(false);
    // Small delay for animation
    setTimeout(() => {
      onDelete(note.id);
    }, 200);
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
    // Reset position
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 + index * 0.05 }}
        className="relative overflow-hidden rounded-[18px]"
        ref={constraintsRef}
      >
        {/* Delete Background */}
        <motion.div
          style={{ opacity: deleteOpacity }}
          className="absolute inset-0 bg-destructive/20 rounded-[18px] flex items-center justify-end pr-6"
        >
          <motion.div
            style={{ scale: deleteScale }}
            className="flex items-center gap-2 text-destructive"
          >
            <Trash2 size={20} />
            <span className="text-sm font-medium">Delete</span>
          </motion.div>
        </motion.div>

        {/* Card Content */}
        <motion.div
          drag="x"
          dragConstraints={{ left: DELETE_THRESHOLD, right: 0 }}
          dragElastic={{ left: 0.1, right: 0 }}
          onDragEnd={handleDragEnd}
          style={{ x, opacity: cardOpacity }}
          className="card-elevated cursor-grab active:cursor-grabbing relative"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-body text-text-primary line-clamp-2 mb-3">
                {note.content}
              </p>
              
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-caption ${typeColors[linkedType]}`}>
                  {typeIcons[linkedType]}
                  {note.linked_label || "Note"}
                </span>
                <span className="text-caption text-text-muted">
                  {formatTimestamp(note.created_at)}
                </span>
              </div>
            </div>
            
            {/* Delete button - prevent drag from interfering */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="flex-shrink-0"
            >
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="p-2.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 active:bg-destructive/30 transition-colors touch-manipulation"
                title="Delete note"
              >
                <Trash2 size={18} className="text-destructive" />
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-bg-1 border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-text-primary">Delete Note</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={handleCancelDelete}
              className="bg-bg-2 border-border text-text-primary hover:bg-bg-2/80"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}