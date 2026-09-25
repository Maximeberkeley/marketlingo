import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { supabase } from "./supabase";
import { log } from "./logger";
import { isLeoMutedSync } from "./voicePrefs";
const activeSounds = /* @__PURE__ */ new Set();
let speechGeneration = 0;
async function stopAllTTS() {
  speechGeneration += 1;
  const sounds = Array.from(activeSounds);
  activeSounds.clear();
  await Promise.all(
    sounds.map(async (sound) => {
      try {
        await sound.stopAsync();
      } catch {
      }
      try {
        await sound.unloadAsync();
      } catch {
      }
    })
  );
}
const EDGE_URL = process.env.EXPO_PUBLIC_EDGE_FUNCTIONS_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY || "";
log.debug("[TTS] EDGE_URL:", EDGE_URL ? `${EDGE_URL.substring(0, 30)}...` : "\u26A0\uFE0F EMPTY");
log.debug("[TTS] ANON_KEY:", SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 10)}...` : "\u26A0\uFE0F EMPTY");
async function getAuthToken() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || SUPABASE_ANON_KEY;
  } catch {
    return SUPABASE_ANON_KEY;
  }
}
function fetchAudioAsBase64(text, voiceId, token) {
  return new Promise((resolve, reject) => {
    const url = `${EDGE_URL}/functions/v1/elevenlabs-tts`;
    log.debug("[TTS] Fetching audio from:", url);
    if (!EDGE_URL) {
      reject(new Error("EDGE_URL is empty \u2014 check EXPO_PUBLIC_EDGE_FUNCTIONS_URL or EXPO_PUBLIC_SUPABASE_URL env vars"));
      return;
    }
    if (!SUPABASE_ANON_KEY) {
      reject(new Error("SUPABASE_ANON_KEY is empty \u2014 check EXPO_PUBLIC_SUPABASE_ANON_KEY env var"));
      return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.responseType = "blob";
    xhr.onload = () => {
      log.debug("[TTS] XHR response status:", xhr.status);
      if (xhr.status !== 200) {
        const blob2 = xhr.response;
        if (blob2) {
          const reader2 = new FileReader();
          reader2.onloadend = () => {
            log.warn("[TTS] Error response body:", reader2.result);
          };
          reader2.readAsText(blob2);
        }
        reject(new Error(`TTS returned ${xhr.status}`));
        return;
      }
      const blob = xhr.response;
      log.debug("[TTS] Blob received, size:", blob?.size || 0, "type:", blob?.type || "unknown");
      if (!blob || blob.size === 0) {
        reject(new Error("Empty audio response"));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result;
        if (!dataUrl || !dataUrl.includes(",")) {
          reject(new Error("FileReader produced invalid result"));
          return;
        }
        const base64 = dataUrl.split(",")[1];
        if (!base64 || base64.length < 100) {
          reject(new Error(`Base64 data too short: ${base64?.length || 0} chars`));
          return;
        }
        log.debug("[TTS] Base64 audio ready, length:", base64.length);
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("FileReader error"));
      reader.readAsDataURL(blob);
    };
    xhr.onerror = () => {
      log.warn("[TTS] XHR network error \u2014 URL:", url);
      reject(new Error("XHR network error"));
    };
    xhr.ontimeout = () => {
      log.warn("[TTS] XHR timeout after 30s");
      reject(new Error("XHR timeout"));
    };
    xhr.timeout = 3e4;
    const body = JSON.stringify({ text, voiceId });
    log.debug("[TTS] Sending XHR, body length:", body.length, "voiceId:", voiceId);
    xhr.send(body);
  });
}
async function speakWithElevenLabs(text, voiceId, tag = "tts") {
  if (!text || text.trim().length < 5) {
    log.debug("[TTS] Text too short, skipping");
    return null;
  }
  if (isLeoMutedSync()) {
    log.debug(`[TTS:${tag}] Muted \u2014 skipping speech`);
    return null;
  }
  const generation = speechGeneration;
  log.debug(`[TTS:${tag}] Starting TTS, text: "${text.substring(0, 50)}...", voice: ${voiceId}`);
  try {
    const token = await getAuthToken();
    log.debug(`[TTS:${tag}] Auth token obtained:`, token ? `${token.substring(0, 10)}...` : "\u26A0\uFE0F EMPTY");
    const base64 = await fetchAudioAsBase64(text, voiceId, token);
    if (generation !== speechGeneration || isLeoMutedSync()) {
      log.debug(`[TTS:${tag}] Cancelled before playback`);
      return null;
    }
    const tempPath = `${FileSystem.cacheDirectory}${tag}_${Date.now()}.mp3`;
    await FileSystem.writeAsStringAsync(tempPath, base64, {
      encoding: "base64"
    });
    const info = await FileSystem.getInfoAsync(tempPath);
    if (!info.exists || info.size < 100) {
      log.warn(`[TTS:${tag}] Temp file too small or missing: ${tempPath}`);
      return null;
    }
    log.debug(`[TTS:${tag}] Audio file written: ${info.size} bytes at ${tempPath}`);
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false
    });
    if (generation !== speechGeneration || isLeoMutedSync()) {
      log.debug(`[TTS:${tag}] Cancelled just before playback`);
      FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {
      });
      return null;
    }
    const { sound } = await Audio.Sound.createAsync(
      { uri: tempPath },
      { shouldPlay: true }
    );
    activeSounds.add(sound);
    log.debug(`[TTS:${tag}] Playback started`);
    sound.setOnPlaybackStatusUpdate((status) => {
      if ("didJustFinish" in status && status.didJustFinish) {
        activeSounds.delete(sound);
        FileSystem.deleteAsync(tempPath, { idempotent: true }).catch(() => {
        });
      }
    });
    if (generation !== speechGeneration) {
      activeSounds.delete(sound);
      sound.stopAsync().catch(() => {
      });
      sound.unloadAsync().catch(() => {
      });
      return null;
    }
    return sound;
  } catch (err) {
    log.warn(`[TTS:${tag}] Error:`, err);
    return null;
  }
}
export {
  speakWithElevenLabs,
  stopAllTTS
};
