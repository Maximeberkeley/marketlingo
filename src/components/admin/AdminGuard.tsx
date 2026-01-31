import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldX } from "lucide-react";

interface AdminGuardProps {
  children: ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate("/");
        return;
      }

      try {
        // Use the secure has_role function to check admin status
        const { data, error } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        });

        if (error) {
          console.error("Error checking admin role:", error);
          navigate("/home");
          return;
        }

        if (!data) {
          // Not an admin
          navigate("/home");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Admin check failed:", error);
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <ShieldX className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-h2 text-text-primary mb-2">Access Denied</h1>
        <p className="text-body text-text-secondary text-center">
          You don't have permission to access this page.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
