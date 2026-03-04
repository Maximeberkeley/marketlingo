// Market illustration imports — flat 3D isometric style
import aerospaceIllustration from "@/assets/illustrations/aerospace.png";
import aiIllustration from "@/assets/illustrations/ai.png";
import biotechIllustration from "@/assets/illustrations/biotech.png";
import cleanenergyIllustration from "@/assets/illustrations/cleanenergy.png";
import fintechIllustration from "@/assets/illustrations/fintech.png";
import evIllustration from "@/assets/illustrations/ev.png";
import cybersecurityIllustration from "@/assets/illustrations/cybersecurity.png";
import roboticsIllustration from "@/assets/illustrations/robotics.png";
import spacetechIllustration from "@/assets/illustrations/spacetech.png";
import healthtechIllustration from "@/assets/illustrations/healthtech.png";
import web3Illustration from "@/assets/illustrations/web3.png";
import agtechIllustration from "@/assets/illustrations/agtech.png";
import logisticsIllustration from "@/assets/illustrations/logistics.png";
import climatetechIllustration from "@/assets/illustrations/climatetech.png";
import neuroscienceIllustration from "@/assets/illustrations/neuroscience.png";

export const marketIllustrations: Record<string, string> = {
  aerospace: aerospaceIllustration,
  ai: aiIllustration,
  biotech: biotechIllustration,
  cleanenergy: cleanenergyIllustration,
  energy: cleanenergyIllustration,
  fintech: fintechIllustration,
  ev: evIllustration,
  cybersecurity: cybersecurityIllustration,
  robotics: roboticsIllustration,
  spacetech: spacetechIllustration,
  healthtech: healthtechIllustration,
  web3: web3Illustration,
  agtech: agtechIllustration,
  logistics: logisticsIllustration,
  climatetech: climatetechIllustration,
  neuroscience: neuroscienceIllustration,
};

// Accent colors per market for light mode
export const marketAccentColors: Record<string, { bg: string; text: string; light: string }> = {
  aerospace: { bg: "bg-indigo-500", text: "text-indigo-600", light: "bg-indigo-50" },
  ai: { bg: "bg-violet-500", text: "text-violet-600", light: "bg-violet-50" },
  biotech: { bg: "bg-emerald-500", text: "text-emerald-600", light: "bg-emerald-50" },
  cleanenergy: { bg: "bg-green-500", text: "text-green-600", light: "bg-green-50" },
  energy: { bg: "bg-green-500", text: "text-green-600", light: "bg-green-50" },
  fintech: { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-50" },
  ev: { bg: "bg-cyan-500", text: "text-cyan-600", light: "bg-cyan-50" },
  cybersecurity: { bg: "bg-slate-700", text: "text-slate-700", light: "bg-slate-50" },
  robotics: { bg: "bg-orange-500", text: "text-orange-600", light: "bg-orange-50" },
  spacetech: { bg: "bg-blue-700", text: "text-blue-700", light: "bg-blue-50" },
  healthtech: { bg: "bg-rose-500", text: "text-rose-600", light: "bg-rose-50" },
  web3: { bg: "bg-purple-500", text: "text-purple-600", light: "bg-purple-50" },
  agtech: { bg: "bg-lime-600", text: "text-lime-700", light: "bg-lime-50" },
  logistics: { bg: "bg-amber-500", text: "text-amber-600", light: "bg-amber-50" },
  climatetech: { bg: "bg-teal-500", text: "text-teal-600", light: "bg-teal-50" },
  neuroscience: { bg: "bg-pink-500", text: "text-pink-600", light: "bg-pink-50" },
};

export function getMarketIllustration(marketId: string): string {
  return marketIllustrations[marketId] || aerospaceIllustration;
}

export function getMarketAccent(marketId: string) {
  return marketAccentColors[marketId] || marketAccentColors.aerospace;
}
