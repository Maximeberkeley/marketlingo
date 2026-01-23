import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, BookOpen, Newspaper, Brain } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

interface NoteEntry {
  id: string;
  preview: string;
  linkedType: "news" | "lesson" | "trainer";
  linkedLabel: string;
  timestamp: string;
  tags: string[];
}

const mockNotes: NoteEntry[] = [
  {
    id: "1",
    preview: "OpenAI's enterprise strategy mirrors Salesforce's early playbook—land with dev tools, expand to enterprise...",
    linkedType: "news",
    linkedLabel: "News · Day 37 · Slide 4",
    timestamp: "2h ago",
    tags: ["competition", "enterprise"],
  },
  {
    id: "2",
    preview: "The 'wrapper' vs 'platform' distinction is key. Wrappers have 12-18 month windows before commoditization.",
    linkedType: "lesson",
    linkedLabel: "Lesson · Week 3 · Slide 2",
    timestamp: "Yesterday",
    tags: ["distribution", "platform_shift"],
  },
  {
    id: "3",
    preview: "Historical parallel: Netscape vs IE. The browser wars show how distribution beats product in platform shifts.",
    linkedType: "trainer",
    linkedLabel: "Trainer · Day 35",
    timestamp: "2 days ago",
    tags: ["competition"],
  },
  {
    id: "4",
    preview: "NVIDIA's moat is deeper than just hardware—CUDA ecosystem lock-in takes 3-5 years to replicate.",
    linkedType: "news",
    linkedLabel: "News · Day 33 · Slide 5",
    timestamp: "3 days ago",
    tags: ["hardware", "infrastructure"],
  },
];

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

export default function NotebookPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const filters = [
    { id: null, label: "All" },
    { id: "news", label: "News" },
    { id: "lesson", label: "Lessons" },
    { id: "trainer", label: "Trainer" },
  ];

  const filteredNotes = mockNotes.filter((note) => {
    const matchesSearch = note.preview.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = !selectedFilter || note.linkedType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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
          <p className="caption text-text-muted">{mockNotes.length} linked notes</p>
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
          {filteredNotes.map((note, index) => (
            <motion.button
              key={note.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-full card-elevated text-left group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-body text-text-primary line-clamp-2 mb-3">
                    {note.preview}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-pill text-caption ${typeColors[note.linkedType]}`}>
                      {typeIcons[note.linkedType]}
                      {note.linkedLabel}
                    </span>
                    <span className="text-caption text-text-muted">{note.timestamp}</span>
                  </div>
                </div>
                
                <ChevronRight size={18} className="text-text-muted group-hover:text-text-secondary transition-colors mt-1" />
              </div>
            </motion.button>
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
