import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_note",
  title: "Create a note",
  description:
    "Save a note to the signed-in learner's MarketLingo notebook, optionally tagged to a market and given a short label.",
  inputSchema: {
    content: z.string().trim().min(1).max(5000).describe("The note text to save."),
    market_id: z.string().trim().min(1).optional().describe("Optional market id to file the note under."),
    linked_label: z.string().trim().min(1).max(120).optional().describe("Optional short label or topic for the note."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ content, market_id, linked_label }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: ctx.getUserId(),
        content,
        market_id: market_id ?? null,
        linked_label: linked_label ?? null,
      })
      .select("id, content, linked_label, market_id, created_at")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Note saved: ${JSON.stringify(data)}` }],
      structuredContent: { note: data },
    };
  },
});
