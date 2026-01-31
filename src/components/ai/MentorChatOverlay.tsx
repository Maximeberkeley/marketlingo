import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { Mentor } from "@/data/mentors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface MentorChatOverlayProps {
  mentor: Mentor | null;
  onClose: () => void;
  context?: string;
  marketId?: string;
}

export function MentorChatOverlay({ mentor, onClose, context, marketId }: MentorChatOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mentor && messages.length === 0) {
      // Add greeting message when mentor appears
      setMessages([{ role: "assistant", content: mentor.greeting }]);
    }
  }, [mentor]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading || !mentor) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const industryName = marketId ? marketId.charAt(0).toUpperCase() + marketId.slice(1).replace(/-/g, ' ') : "the selected industry";
      const systemPrompt = `You are ${mentor.name}, ${mentor.title}. ${mentor.personality}
      
Your specialties include: ${mentor.specialties.join(", ")}.

You're helping a user learn about the ${industryName} industry to prepare them to build a startup or invest in this space. 
Be conversational, helpful, and draw from deep industry knowledge. Keep responses concise but insightful (2-3 paragraphs max).

${context ? `Current lesson context: ${context}` : ""}`;

      const response = await supabase.functions.invoke("mentor-chat", {
        body: {
          messages: messages.map(m => ({ role: m.role, content: m.content })).concat([
            { role: "user", content: userMessage }
          ]),
          systemPrompt,
        },
      });

      if (response.error) throw response.error;

      const assistantMessage = response.data?.message || "I'm having trouble responding right now. Let me think...";
      setMessages(prev => [...prev, { role: "assistant", content: assistantMessage }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "I'm having a moment. Let's try that again - what were you asking about?" 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mentor) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-hidden"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 h-[70vh] bg-bg-1 rounded-t-3xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <div className="relative">
              <img
                src={mentor.avatar}
                alt={mentor.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-accent"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-bg-1" />
            </div>
            <div className="flex-1">
              <h3 className="text-body font-semibold text-text-primary">{mentor.name}</h3>
              <p className="text-caption text-accent">{mentor.title}</p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-bg-2 flex items-center justify-center hover:bg-bg-2/80 transition-colors"
            >
              <X size={20} className="text-text-secondary" />
            </button>
          </div>

          {/* Specialties */}
          <div className="px-4 py-2 border-b border-border flex gap-2 overflow-x-auto scrollbar-hide">
            {mentor.specialties.map((specialty) => (
              <span key={specialty} className="chip whitespace-nowrap text-[11px]">
                {specialty}
              </span>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    message.role === "user"
                      ? "bg-accent text-white rounded-br-md"
                      : "bg-bg-2 text-text-primary rounded-bl-md"
                  }`}
                >
                  <p className="text-body leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-bg-2 p-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 pb-8 border-t border-border bg-bg-1 safe-area-bottom">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder={`Ask ${mentor.name.split(" ")[0]} anything...`}
                className="flex-1 bg-bg-2 border-border rounded-full px-4"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full p-0"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
