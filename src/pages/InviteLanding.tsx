import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import leoMascot from "@/assets/mascot/leo-reference.png";

const APP_STORE_URL = "https://apps.apple.com/app/marketlingo/id6758534066";

type Preview = { first_name: string; avatar_url: string | null };

export default function InviteLanding() {
  const { code: raw = "" } = useParams();
  const code = raw.trim().toUpperCase();
  const [state, setState] = useState<"loading" | "valid" | "invalid">("loading");
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    document.title = "You're invited to MarketLingo";
    if (!/^[A-Z0-9]{4,12}$/.test(code)) { setState("invalid"); return; }
    supabase.rpc("get_invite_preview", { p_code: code }).then(({ data, error }) => {
      const row = (data as Preview[] | null)?.[0];
      if (error || !row) { setState("invalid"); return; }
      setPreview(row);
      setState("valid");
    });
  }, [code]);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center flex flex-col items-center gap-6">
        <img src={leoMascot} alt="Leo the fox" className="w-40 h-40 object-contain" />
        {state === "loading" && <p className="text-muted-foreground">Checking your invite…</p>}

        {state === "invalid" && (
          <>
            <h1 className="text-2xl font-bold">This invite link isn't valid</h1>
            <Button asChild size="lg" className="w-full">
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Get MarketLingo on the App Store</a>
            </Button>
          </>
        )}

        {state === "valid" && preview && (
          <>
            <h1 className="text-2xl font-bold">{preview.first_name} invited you to MarketLingo</h1>
            <p className="text-muted-foreground">Learn how an industry really works, 5 minutes a day.</p>
            <Button asChild size="lg" className="w-full">
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">Download on the App Store</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="w-full">
              <a href={`marketlingo://invite/${code}`}>Already have the app? Open it</a>
            </Button>
            <div className="rounded-2xl bg-muted px-6 py-4 w-full">
              <p className="text-sm text-muted-foreground">If the app asks, enter code</p>
              <p className="text-3xl font-extrabold tracking-[0.3em] mt-1">{code}</p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
