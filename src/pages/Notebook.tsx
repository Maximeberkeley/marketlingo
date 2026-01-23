import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, BookOpen, Newspaper, Brain, Loader2, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NoteEntry {
  id: string;
  content: string;
  linked_label: string | null;
  created_at: string;
  stack_id: string | null;
  slide_id: string | null;
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

export default function NotebookPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const filters = [
    { id: null, label: "All" },
    { id: "news", label: "News" },
    { id: "lesson", label: "Lessons" },
    { id: "trainer", label: "Trainer" },
  ];

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
      } else {
        setNotes(data || []);
      }
      setLoading(false);
    };

    fetchNotes();
  }, [user]);

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId);

    if (error) {
      toast.error("Failed to delete note");
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const linkedType = getLinkedType(note.linked_label);
    const matchesFilter = !selectedFilter || linkedType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="screen-padding pt-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-h1 text-text-primary mb-1">Notebook</h1>
          <p className="caption text-text-muted">{notes.length} linked notes</p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-bg-2 border border-border rounded-[16px] text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1"
        >
          {filters.map((filter) => (
            <button
              key={filter.id || "all"}
              onClick={() => setSelectedFilter(filter.id)}
              className={`chip whitespace-nowrap transition-colors ${
                selectedFilter === filter.id
                  ? "chip-accent"
                  : "hover:border-text-muted"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Notes List */}
        <div className="space-y-3 pb-8">
          {filteredNotes.map((note, index) => {
            const linkedType = getLinkedType(note.linked_label);
            
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="w-full card-elevated text-left group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-text-primary line-clamp-2 mb-3">
                      {note.content}
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-pill text-caption ${typeColors[linkedType]}`}>
                        {typeIcons[linkedType]}
                        {note.linked_label || "Note"}
                      </span>
                      <span className="text-caption text-text-muted">
                        {formatTimestamp(note.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="p-2 text-text-muted hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredNotes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen size={48} className="mx-auto mb-4 text-text-muted" />
            <h3 className="text-h3 text-text-secondary mb-2">No notes found</h3>
            <p className="text-body text-text-muted">
              {searchQuery ? "Try a different search term" : "Start adding notes while reading stacks"}
            </p>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
