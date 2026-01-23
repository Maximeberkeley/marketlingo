import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, BookOpen, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SwipeableNoteCard } from "@/components/notebook/SwipeableNoteCard";
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

function getLinkedType(label: string | null): "news" | "lesson" | "trainer" {
  if (!label) return "lesson";
  const lower = label.toLowerCase();
  if (lower.includes("news") || lower.includes("daily")) return "news";
  if (lower.includes("trainer")) return "trainer";
  return "lesson";
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
      <div className="screen-padding pt-12 pb-28">
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

        {/* Swipe hint */}
        {filteredNotes.length > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-caption text-text-muted mb-3 text-center"
          >
            Swipe left to delete
          </motion.p>
        )}

        {/* Notes List */}
        <div className="space-y-3 pb-8">
          {filteredNotes.map((note, index) => (
            <SwipeableNoteCard
              key={note.id}
              note={note}
              onDelete={handleDeleteNote}
              index={index}
            />
          ))}
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