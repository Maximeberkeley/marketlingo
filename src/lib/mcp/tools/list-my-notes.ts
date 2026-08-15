import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_notes",
  title: "List my notes",
  description:
    "List the signed-in learner's saved MarketLingo notebook entries, newest first, with an optional keyword search and market filter.",
  inputSchema: {
    search: z.string().trim().min(1).optional().describe("Optional keyword to match in note content."),
    market_id: z.string().trim().min(1).optional().describe("Optional market id filter."),
    limit: z.number().int().min(1).max(100).optional().describe("Max notes to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, market_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("notes")
      .select("id, content, linked_label, market_id, stack_id, created_at, updated_at")
      .eq("user_id", ctx.getUserId())
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);

    if (search) query = query.ilike("content", `%${search}%`);
    if (market_id) query = query.eq("market_id", market_id);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) {
      return { content: [{ type: "text", text: "No notes found." }], structuredContent: { notes: [] } };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { notes: data },
    };
  },
});
