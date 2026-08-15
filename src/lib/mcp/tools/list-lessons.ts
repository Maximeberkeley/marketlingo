import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_lessons",
  title: "List lessons",
  description:
    "Browse published MarketLingo lesson stacks for a market. Optionally filter by title keyword or stack type (for example lesson, news, drill).",
  inputSchema: {
    market_id: z.string().trim().min(1).describe("Market id from list_markets, e.g. 'ai'."),
    search: z.string().trim().min(1).optional().describe("Optional keyword to match in the lesson title."),
    stack_type: z.string().trim().min(1).optional().describe("Optional stack type filter."),
    limit: z.number().int().min(1).max(50).optional().describe("Max lessons to return (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ market_id, search, stack_type, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("stacks")
      .select("id, market_id, title, stack_type, duration_minutes, tags, published_at")
      .eq("market_id", market_id)
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit ?? 20);

    if (search) query = query.ilike("title", `%${search}%`);
    if (stack_type) query = query.eq("stack_type", stack_type);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) {
      return { content: [{ type: "text", text: `No lessons found for market "${market_id}".` }] };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { lessons: data },
    };
  },
});
