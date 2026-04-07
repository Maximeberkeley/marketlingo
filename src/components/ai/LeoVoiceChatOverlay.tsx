import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, MicOff, Send, Loader2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { LeoPuppet } from "@/components/mascot/LeoStateMachine";
import type { LeoAnim } from "@/components/mascot/LeoStateMachine";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface LeoVoiceChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  marketId?: string;
  leoImage?: string;
}

export function LeoVoiceChatOverlay({ isOpen, onClose, marketId, leoImage }: LeoVoiceChatOverlayProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [leoAnim, setLeoAnim] = useState<LeoAnim>("idle");
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = "Hey! 🦊 I'm Leo. Tap the mic and ask me anything about your industry!";
      setMessages([{ role: "assistant", content: greeting }]);
      speakText(greeting);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speakText = async (text: string) => {
    setIsSpeaking(true);
    setLeoAnim("celebrating");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId: "JBFqnCBsd6RMkjVDRZzb" }),
        }
      );

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        setLeoAnim("idle");
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();
    } catch (error) {
      console.error("TTS error:", error);
      setIsSpeaking(false);
      setLeoAnim("idle");
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setLeoAnim("thinking");

    try {
      const { data, error } = await supabase.functions.invoke("leo-voice-chat", {
        body: {
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          lessonContext: `${marketId || "general"} industry learning`,
        },
      });

      if (error) throw error;
      
      const reply = data?.message || "Hmm, let me think about that... 🤔";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      await speakText(reply);
    } catch (err) {
      console.error("Leo chat error:", err);
      const fallback = "Oops, I had a little hiccup! Try asking again. 🦊";
      setMessages(prev => [...prev, { role: "assistant", content: fallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        
        if (audioBlob.size < 1000) {
          setTranscript("");
          return;
        }

        // Transcribe via STT edge function
        setIsLoading(true);
        setLeoAnim("thinking");
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const { data: session } = await supabase.auth.getSession();
          const token = session?.session?.access_token;

          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-stt`,
            {
              method: "POST",
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              body: formData,
            }
          );

          if (!response.ok) throw new Error("STT failed");
          const result = await response.json();
          
          if (result.text?.trim()) {
            setTranscript(result.text);
            await sendMessage(result.text);
          }
        } catch (err) {
          console.error("STT error:", err);
          setLeoAnim("idle");
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTranscript("");
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }, [messages, marketId]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, []);

  const handleClose = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsSpeaking(false);
    setMessages([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-hidden"
        onClick={handleClose}
      >
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-bg-1 rounded-t-3xl flex flex-col overflow-hidden"
          style={{
            paddingBottom: "max(16px, env(safe-area-inset-bottom, 0px))",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-body font-semibold text-text-primary">Leo</span>
              <span className="text-caption text-text-muted">
                {isSpeaking ? "Speaking..." : isRecording ? "Listening..." : isLoading ? "Thinking..." : "Ready"}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-bg-2 flex items-center justify-center hover:bg-bg-2/80 transition-colors"
            >
              <X size={20} className="text-text-secondary" />
            </button>
          </div>

          {/* Leo Character - Centered */}
          <div className="flex flex-col items-center py-4">
            <motion.div
              animate={{
                scale: isSpeaking ? [1, 1.05, 1] : isRecording ? [1, 1.02, 1] : 1,
              }}
              transition={{
                duration: isSpeaking ? 0.8 : 1.5,
                repeat: isSpeaking || isRecording ? Infinity : 0,
                ease: "easeInOut",
              }}
            >
              <div className="relative">
                <LeoPuppet size={140} animation={leoAnim} />
                {/* Pulse ring when recording */}
                {isRecording && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-accent"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                {/* Sound wave when speaking */}
                {isSpeaking && (
                  <motion.div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-end gap-0.5"
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-accent rounded-full"
                        animate={{ height: [4, 12 + Math.random() * 8, 4] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3 max-h-[30vh]">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-br-sm"
                      : "bg-bg-2 text-text-primary rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-bg-2 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-text-muted" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Controls */}
          <div className="px-4 pt-3 pb-2 border-t border-border">
            {/* Voice button - primary action */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                className={`rounded-full w-16 h-16 p-0 ${
                  isRecording
                    ? "bg-destructive animate-pulse"
                    : "bg-accent hover:bg-accent/90"
                }`}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading || isSpeaking}
              >
                {isRecording ? (
                  <MicOff size={28} className="text-white" />
                ) : (
                  <Mic size={28} className="text-white" />
                )}
              </Button>
            </div>
            <p className="text-center text-[11px] text-text-muted mb-3">
              {isRecording ? "Tap to stop recording" : isSpeaking ? "Leo is speaking..." : "Tap the mic to talk to Leo"}
            </p>

            {/* Text fallback */}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Or type a message..."
                className="flex-1 text-sm"
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                disabled={isLoading || isRecording}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading || isRecording}
                className="shrink-0"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
