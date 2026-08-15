import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listMarketsTool from "./tools/list-markets";
import getMyProgressTool from "./tools/get-my-progress";
import listLessonsTool from "./tools/list-lessons";
import getDrillsTool from "./tools/get-drills";
import listMyNotesTool from "./tools/list-my-notes";
import createNoteTool from "./tools/create-note";
import deleteNoteTool from "./tools/delete-note";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "marketlingo",
  title: "MarketLingo",
  version: "0.1.0",
  instructions:
    "Tools for MarketLingo, an industry-fluency learning app. Call list_markets first to resolve a market id, get_my_progress for the signed-in learner's track, streak and XP, list_lessons and get_drills to browse study content, and list_my_notes / create_note / delete_note to manage their notebook. All tools act as the signed-in user.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listMarketsTool,
    getMyProgressTool,
    listLessonsTool,
    getDrillsTool,
    listMyNotesTool,
    createNoteTool,
    deleteNoteTool,
  ],
});
