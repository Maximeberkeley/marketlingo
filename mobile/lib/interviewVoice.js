import { supabase } from "./supabase";
import { speakWithElevenLabs } from "./tts";
import { log } from "./logger";
import { LEO_VOICE_ID } from "../data/mentors";
const EDGE_URL = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const headers = {
    "Content-Type": "application/json"
  };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}
async function speakAsLeo(text) {
  if (!text || text.trim().length === 0) return null;
  try {
    log.debug("[Leo coach] Speaking:", text.substring(0, 60) + "...");
    return await speakWithElevenLabs(text, LEO_VOICE_ID, "leo_interview");
  } catch (err) {
    log.warn("Leo coach TTS error:", err);
    return null;
  }
}
async function transcribeAudio(uri) {
  try {
    const sttUrl = `${EDGE_URL}/functions/v1/elevenlabs-stt`;
    const authHeaders = await getAuthHeaders();
    const formData = new FormData();
    formData.append("audio", {
      uri,
      type: "audio/m4a",
      name: "recording.m4a"
    });
    const sttResponse = await fetch(sttUrl, {
      method: "POST",
      headers: {
        ...authHeaders.Authorization ? { Authorization: authHeaders.Authorization } : {}
      },
      body: formData
    });
    if (!sttResponse.ok) {
      log.warn("STT failed:", sttResponse.status);
      return "";
    }
    const data = await sttResponse.json();
    return data.text || "";
  } catch (err) {
    log.warn("Transcription error:", err);
    return "";
  }
}
function buildFeedbackNarration(feedback) {
  if (!feedback) return "";
  const parts = [];
  const coachLine = feedback.leoSays || feedback.sophiaSays;
  if (coachLine) {
    parts.push(coachLine);
  }
  parts.push(`You scored ${feedback.score} out of 100.`);
  if (feedback.awesome?.length > 0) {
    parts.push(`Here's what was awesome. ${feedback.awesome.join(". ")}.`);
  }
  if (feedback.missing?.length > 0) {
    parts.push(`Here's what was missing. ${feedback.missing.join(". ")}.`);
  }
  if (feedback.trySaying) {
    parts.push(`Try saying something like this instead. ${feedback.trySaying}`);
  }
  if (feedback.buzzwordsUsed?.length > 0) {
    parts.push(`Great job using these industry terms: ${feedback.buzzwordsUsed.join(", ")}.`);
  }
  if (feedback.buzzwordsMissed?.length > 0) {
    parts.push(`Next time, try to include: ${feedback.buzzwordsMissed.join(", ")}.`);
  }
  return parts.join(" ");
}
export {
  buildFeedbackNarration,
  speakAsLeo,
  transcribeAudio
};
