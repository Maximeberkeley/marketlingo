import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, BookOpen, Loader2, Plus, Lightbulb, Calendar, Tag, ArrowLeft, Sparkles, PenLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { SwipeableNoteCard } from "@/components/notebook/SwipeableNoteCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useKeyboardAware, scrollInputIntoView } from "@/hooks/useKeyboardAware";

// Import warm illustration
import notebookHero from "@/assets/cards/notebook-hero.jpg";

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

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Group notes by date
function groupNotesByDate(notes: NoteEntry[]): Record<string, NoteEntry[]> {
  const groups: Record<string, NoteEntry[]> = {};
  
  notes.forEach(note => {
    const date = new Date(note.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    } else {
      key = date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    }
    
    if (!groups[key]) groups[key] = [];
    groups[key].push(note);
  });
  
  return groups;
}

export default function NotebookPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  const filters = [
    { id: null, label: "All", icon: BookOpen },
    { id: "lesson", label: "Lessons", icon: Lightbulb },
    { id: "news", label: "News", icon: Calendar },
    { id: "trainer", label: "Trainer", icon: Tag },
  ];

  // Fetch user's selected market first
  useEffect(() => {
    const fetchMarket = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("selected_market")
        .eq("id", user.id)
        .maybeSingle();
      
      if (profile?.selected_market) {
        setSelectedMarket(profile.selected_market);
      } else {
        const stored = localStorage.getItem("selectedMarket");
        if (stored) setSelectedMarket(stored);
      }
    };
    
    fetchMarket();
  }, [user]);

  // Fetch notes filtered by market_id directly
  useEffect(() => {
    const fetchNotes = async () => {
      if (!user || !selectedMarket) return;

      // Query notes that belong to this specific market
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .eq("market_id", selectedMarket)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notes:", error);
        setNotes([]);
      } else {
        setNotes(data || []);
      }
      setLoading(false);
    };

    if (selectedMarket) {
      fetchNotes();
    }
  }, [user, selectedMarket]);

  const handleDeleteNote = async (noteId: string) => {
    if (!user) {
      toast.error("You must be logged in to delete notes");
      return;
    }
    
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", noteId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete note");
    } else {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success("Note deleted");
    }
  };

  const handleAddNote = async () => {
    if (!user || !newNoteContent.trim() || !selectedMarket) return;

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        content: newNoteContent.trim(),
        linked_label: "Personal Note",
        market_id: selectedMarket,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add note");
    } else {
      setNotes((prev) => [data, ...prev]);
      setNewNoteContent("");
      setShowAddNote(false);
      toast.success("Note added!");
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase());
    const linkedType = getLinkedType(note.linked_label);
    const matchesFilter = !selectedFilter || linkedType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const groupedNotes = groupNotesByDate(filteredNotes);

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center state-container">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="screen-padding pt-safe pb-28">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <button onClick={() => navigate(-1)} className="p-2 -ml-2">
            <ArrowLeft size={24} className="text-text-secondary" />
          </button>
          <div className="flex-1">
            <h1 className="text-h1 text-text-primary">My Notebook</h1>
            <p className="text-caption text-text-muted">{notes.length} insights captured</p>
          </div>
          <button
            onClick={() => setShowAddNote(true)}
            className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center"
          >
            <Plus size={20} className="text-accent" />
          </button>
        </motion.div>

        {/* Hero Section - Only show when empty */}
        {notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="relative overflow-hidden rounded-2xl">
              <img src={notebookHero} alt="Notebook" className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-rose-900/90 via-rose-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h2 className="text-lg font-bold text-white mb-1">Your Learning Journal</h2>
                <p className="text-sm text-white/80">
                  Capture key insights as you learn. Build your personal knowledge base.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pedagogical Tips */}
        {notes.length > 0 && notes.length < 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-accent/5 border border-accent/20"
          >
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="text-accent mt-0.5" />
              <div>
                <p className="text-caption font-medium text-accent">Pro Tip</p>
                <p className="text-[11px] text-text-muted">
                  Add notes during lessons to reinforce learning. Studies show writing helps retention by 30%.
                </p>
              </div>
            </div>
          </motion.div>
        )}

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
              placeholder="Search your notes…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-bg-2 border border-border rounded-xl text-body text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1"
        >
          {filters.map((filter) => (
            <button
              key={filter.id || "all"}
              onClick={() => setSelectedFilter(filter.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption whitespace-nowrap transition-all",
                selectedFilter === filter.id
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-bg-2 text-text-secondary border border-border hover:border-text-muted"
              )}
            >
              <filter.icon size={12} />
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Notes by Date */}
        {Object.keys(groupedNotes).length > 0 ? (
          <div className="space-y-5">
            {Object.entries(groupedNotes).map(([date, dateNotes], groupIdx) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + groupIdx * 0.05 }}
              >
                <h3 className="text-caption font-medium text-text-muted mb-2 flex items-center gap-2">
                  <Calendar size={12} />
                  {date}
                </h3>
                <div className="space-y-2">
                  {dateNotes.map((note, index) => (
                    <SwipeableNoteCard
                      key={note.id}
                      note={note}
                      onDelete={handleDeleteNote}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <BookOpen size={48} className="mx-auto mb-4 text-text-muted" />
            <h3 className="text-h3 text-text-secondary mb-2">
              {searchQuery ? "No notes found" : "Start your notebook"}
            </h3>
            <p className="text-body text-text-muted mb-4">
              {searchQuery
                ? "Try a different search term"
                : "Capture insights while learning to build your knowledge base"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowAddNote(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-accent/10 border border-accent/30 text-caption text-accent font-medium"
              >
                <PenLine size={14} />
                Add your first note
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Note Modal - bottom sheet style with keyboard awareness + home indicator safety */}
      <AnimatePresence>
        {showAddNote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center"
            onClick={() => setShowAddNote(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-bg-1 rounded-t-[24px] max-h-[85vh] overflow-hidden flex flex-col"
              style={{
                // Always respect home indicator, even when keyboard is closed
                paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
              }}
            >
              {/* Handle bar - for interactive dismissal hint */}
              <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-text-muted/30" />
              </div>
              
              {/* Scrollable content area with overscroll containment */}
              <div 
                className="px-5 pb-4 overflow-y-auto flex-1"
                style={{ overscrollBehavior: 'contain' }}
              >
                <h2 className="text-h2 text-text-primary mb-4">New Note</h2>
                
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="What insight do you want to remember?"
                  className="w-full h-32 p-4 bg-bg-2 border border-border rounded-xl text-body text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent"
                  autoFocus
                  onFocus={(e) => scrollInputIntoView(e.target, true)}
                />
                
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setShowAddNote(false)}
                    className="flex-1 py-3 rounded-xl bg-bg-2 border border-border text-caption text-text-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={!newNoteContent.trim()}
                    className="flex-1 py-3 rounded-xl bg-accent text-white text-caption font-medium disabled:opacity-50"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
