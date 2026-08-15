import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "delete_note",
  title: "Delete a note",
  description: "Permanently delete one of the signed-in learner's MarketLingo notebook entries by its id.",
  inputSchema: {
    note_id: z.string().uuid().describe("Id of the note to delete, from list_my_notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ note_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("notes")
      .delete()
      .eq("id", note_id)
      .eq("user_id", ctx.getUserId())
      .select("id");

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) {
      return { content: [{ type: "text", text: "No note with that id belongs to you." }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Deleted note ${note_id}.` }],
      structuredContent: { deleted_id: note_id },
    };
  },
});
