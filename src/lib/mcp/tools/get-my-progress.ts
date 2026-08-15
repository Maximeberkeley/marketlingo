import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_my_progress",
  title: "Get my learning progress",
  description:
    "Get the signed-in learner's MarketLingo snapshot: selected market, current day of the 180-day track, streak, learning goal, familiarity level, XP and level.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const userId = ctx.getUserId();
    const supabase = supabaseForUser(ctx);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("username, selected_market, familiarity_level, is_pro_user")
      .eq("id", userId)
      .maybeSingle();
    if (profileError) {
      return { content: [{ type: "text", text: profileError.message }], isError: true };
    }

    const marketId = profile?.selected_market ?? null;

    const [{ data: progress }, { data: xp }] = await Promise.all([
      marketId
        ? supabase
            .from("user_progress")
            .select("market_id, current_day, current_streak, longest_streak, learning_goal, familiarity_level, last_activity_at, completed_stacks")
            .eq("user_id", userId)
            .eq("market_id", marketId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      marketId
        ? supabase
            .from("user_xp")
            .select("total_xp, current_level, xp_to_next_level")
            .eq("user_id", userId)
            .eq("market_id", marketId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const snapshot = {
      username: profile?.username ?? null,
      market_id: marketId,
      is_pro_user: profile?.is_pro_user ?? false,
      current_day: (progress as { current_day?: number } | null)?.current_day ?? null,
      current_streak: (progress as { current_streak?: number } | null)?.current_streak ?? 0,
      longest_streak: (progress as { longest_streak?: number } | null)?.longest_streak ?? 0,
      learning_goal: (progress as { learning_goal?: string } | null)?.learning_goal ?? null,
      familiarity_level:
        (progress as { familiarity_level?: string } | null)?.familiarity_level ??
        profile?.familiarity_level ??
        null,
      last_activity_at: (progress as { last_activity_at?: string } | null)?.last_activity_at ?? null,
      completed_stacks_count:
        ((progress as { completed_stacks?: unknown[] } | null)?.completed_stacks ?? []).length,
      total_xp: (xp as { total_xp?: number } | null)?.total_xp ?? 0,
      current_level: (xp as { current_level?: number } | null)?.current_level ?? 1,
      xp_to_next_level: (xp as { xp_to_next_level?: number } | null)?.xp_to_next_level ?? null,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(snapshot) }],
      structuredContent: snapshot,
    };
  },
});
