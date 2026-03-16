import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, MessageSquare, FileText, Lightbulb, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsItem } from "./types";
import { supabase } from "@/integrations/supabase/client";

interface ArticleDetailSheetProps {
  article: NewsItem | null;
  onClose: () => void;
  marketId: string;
}

type AiMode = "discuss" | "summarize" | "why" | null;

export function ArticleDetailSheet({ article, onClose, marketId }: ArticleDetailSheetProps) {
  const [aiMode, setAiMode] = useState<AiMode>(null);
  const [aiResponse, setAiResponse] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  const handleAiAction = async (mode: AiMode) => {
    if (!article || !mode) return;
    setAiMode(mode);
    setAiLoading(true);
    setAiResponse("");

    const prompts: Record<string, string> = {
      summarize: `Provide a structured 3-bullet summary of this article: "${article.title}" from ${article.sourceName}. Context: ${article.summary || "No additional context."}`,
      why: `Explain in 2-3 sentences why this matters for professionals in the ${marketId} industry: "${article.title}". Context: ${article.summary || ""}`,
      discuss: `I'd like to discuss this article: "${article.title}" from ${article.sourceName}. ${article.summary || ""}. What are the key implications?`,
    };

    try {
      const { data, error } = await supabase.functions.invoke("mentor-chat", {
        body: {
          messages: [{ role: "user", content: prompts[mode] }],
          systemPrompt: `You are an expert ${marketId} industry analyst. Be concise, insightful, and professional.`,
        },
      });

      if (error) throw error;
      const reply = data?.reply || data?.choices?.[0]?.message?.content || "Unable to generate insight.";
      setAiResponse(reply);
      if (mode === "discuss") {
        setChatMessages([
          { role: "user", content: prompts[mode] },
          { role: "assistant", content: reply },
        ]);
      }
    } catch (err) {
      setAiResponse("Failed to generate AI insight. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || aiLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const newMessages = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(newMessages);
    setAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("mentor-chat", {
        body: {
          messages: newMessages,
          systemPrompt: `You are an expert ${marketId} industry analyst discussing: "${article?.title}". Be concise and insightful.`,
        },
      });
      if (error) throw error;
      const reply = data?.reply || data?.choices?.[0]?.message?.content || "...";
      setChatMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages([...newMessages, { role: "assistant", content: "Failed to respond." }]);
    } finally {
      setAiLoading(false);
    }
  };

  const resetAi = () => {
    setAiMode(null);
    setAiResponse("");
    setChatMessages([]);
  };

  return (
    <AnimatePresence>
      {article && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] rounded-t-3xl bg-background overflow-hidden flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center py-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto">
              {/* Hero image */}
              {article.imageUrl && (
                <div className="relative w-full h-48 overflow-hidden">
                  <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                </div>
              )}

              <div className="px-5 pb-4">
                {/* Category + source */}
                <div className="flex items-center gap-2 mt-3 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary/10 text-primary">
                    {article.categoryTag}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{article.sourceName}</span>
                  <span className="text-[10px] text-muted-foreground">{article.publishedAt}</span>
                </div>

                {/* Title */}
                <h2 className="text-lg font-bold text-foreground leading-snug mb-3">
                  {article.title}
                </h2>

                {/* Summary */}
                {article.summary && (
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {article.summary}
                  </p>
                )}

                {/* Source link */}
                <a
                  href={article.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline mb-5"
                >
                  Read full article
                  <ExternalLink size={14} />
                </a>

                {/* AI Actions */}
                <div className="border-t border-border pt-4">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    AI-Powered Insights
                  </p>
                  <div className="flex gap-2">
                    {[
                      { mode: "discuss" as const, icon: MessageSquare, label: "Discuss" },
                      { mode: "summarize" as const, icon: FileText, label: "Summarize" },
                      { mode: "why" as const, icon: Lightbulb, label: "Why it matters" },
                    ].map(({ mode, icon: Icon, label }) => (
                      <button
                        key={mode}
                        onClick={() => { resetAi(); handleAiAction(mode); }}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                          aiMode === mode
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon size={13} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* AI Response */}
                  <AnimatePresence mode="wait">
                    {(aiLoading || aiResponse) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        {aiLoading && !aiResponse ? (
                          <div className="flex items-center gap-2 p-4 rounded-2xl bg-muted/50">
                            <Loader2 size={16} className="animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Analyzing...</span>
                          </div>
                        ) : (
                          <div className="p-4 rounded-2xl bg-muted/50 border border-border">
                            {aiMode === "discuss" ? (
                              <>
                                {/* Chat messages */}
                                <div className="space-y-3 max-h-60 overflow-y-auto mb-3">
                                  {chatMessages.map((msg, i) => (
                                    <div
                                      key={i}
                                      className={cn(
                                        "text-sm leading-relaxed",
                                        msg.role === "user"
                                          ? "text-foreground font-medium"
                                          : "text-muted-foreground"
                                      )}
                                    >
                                      {msg.content}
                                    </div>
                                  ))}
                                  {aiLoading && (
                                    <div className="flex items-center gap-1.5">
                                      <Loader2 size={12} className="animate-spin text-primary" />
                                      <span className="text-xs text-muted-foreground">Thinking...</span>
                                    </div>
                                  )}
                                </div>
                                {/* Chat input */}
                                <div className="flex gap-2">
                                  <input
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChatSend()}
                                    placeholder="Ask a follow-up..."
                                    className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
                                  />
                                  <button
                                    onClick={handleChatSend}
                                    disabled={!chatInput.trim() || aiLoading}
                                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground disabled:opacity-50 transition-opacity"
                                  >
                                    <Send size={14} />
                                  </button>
                                </div>
                              </>
                            ) : (
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                                {aiResponse}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
