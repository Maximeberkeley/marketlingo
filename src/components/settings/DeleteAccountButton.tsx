import { useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function DeleteAccountButton() {
  const [step, setStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleDelete = async () => {
    setStep("deleting");
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await signOut();
      navigate("/auth");
    } catch {
      setStep("idle");
      alert("Failed to delete account. Please try again.");
    }
  };

  if (step === "confirm") {
    return (
      <div className="space-y-2">
        <p className="text-caption text-red-400 text-center">
          All your progress, XP, streaks, notes, and data will be permanently erased. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setStep("idle")}
            className={cn(
              "flex-1 p-3 rounded-card font-medium",
              "bg-bg-2 border border-border text-text-primary"
            )}
          >
            Go Back
          </button>
          <button
            onClick={handleDelete}
            className={cn(
              "flex-1 p-3 rounded-card font-medium",
              "bg-red-600 text-white hover:bg-red-700 transition-all"
            )}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep("confirm")}
      disabled={step === "deleting"}
      className={cn(
        "w-full flex items-center justify-center gap-2 p-4 rounded-card",
        "border border-border text-text-muted",
        "hover:text-red-400 hover:border-red-500/20 transition-all",
        step === "deleting" && "opacity-50 cursor-not-allowed"
      )}
    >
      <Trash2 size={16} />
      <span className="text-caption font-medium">
        {step === "deleting" ? "Deleting…" : "Delete Account"}
      </span>
    </button>
  );
}
