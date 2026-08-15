import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_drills",
  title: "Get practice drills",
  description:
    "Fetch true/false practice drill questions for a market, optionally for a specific day of the 180-day track, including the explanation for each statement.",
  inputSchema: {
    market_id: z.string().trim().min(1).describe("Market id from list_markets."),
    day_number: z.number().int().min(1).max(365).optional().describe("Optional day of the track."),
    limit: z.number().int().min(1).max(30).optional().describe("Max questions to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ market_id, day_number, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("drill_questions")
      .select("id, market_id, day_number, set_number, question_number, statement, is_true, explanation, category, difficulty")
      .eq("market_id", market_id)
      .order("day_number", { ascending: true })
      .order("question_number", { ascending: true })
      .limit(limit ?? 10);

    if (day_number !== undefined) query = query.eq("day_number", day_number);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) {
      return { content: [{ type: "text", text: `No drills found for market "${market_id}".` }] };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { drills: data },
    };
  },
});
