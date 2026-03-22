/** Shared segment colors used across Investment Lab, Key Players, Watchlist */
export const segmentColors: Record<string, { bg: string; text: string }> = {
  commercial: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  defense: { bg: 'rgba(239,68,68,0.2)', text: '#F87171' },
  space: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
  propulsion: { bg: 'rgba(249,115,22,0.2)', text: '#FB923C' },
  suppliers: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  services: { bg: 'rgba(6,182,212,0.2)', text: '#22D3EE' },
  devices: { bg: 'rgba(167,139,250,0.2)', text: '#C4B5FD' },
  therapeutics: { bg: 'rgba(236,72,153,0.2)', text: '#F472B6' },
  pharma: { bg: 'rgba(99,102,241,0.2)', text: '#818CF8' },
  models: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  hardware: { bg: 'rgba(6,182,212,0.2)', text: '#22D3EE' },
  enterprise: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  payments: { bg: 'rgba(249,115,22,0.2)', text: '#FB923C' },
  investing: { bg: 'rgba(139,92,246,0.2)', text: '#A78BFA' },
  infrastructure: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  lending: { bg: 'rgba(251,191,36,0.2)', text: '#FCD34D' },
  neobank: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
  charging: { bg: 'rgba(16,185,129,0.2)', text: '#34D399' },
  battery: { bg: 'rgba(99,102,241,0.2)', text: '#818CF8' },
  // Previously missing segments
  diagnostics: { bg: 'rgba(244,63,94,0.2)', text: '#FB7185' },
  fuel_cells: { bg: 'rgba(34,211,238,0.2)', text: '#22D3EE' },
  hydrogen: { bg: 'rgba(56,189,248,0.2)', text: '#38BDF8' },
  storage: { bg: 'rgba(251,146,60,0.2)', text: '#FB923C' },
  utility: { bg: 'rgba(74,222,128,0.2)', text: '#4ADE80' },
};

export const SEGMENT_FALLBACK = { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA' };

export function getSegmentStyle(segment: string) {
  return segmentColors[segment] || SEGMENT_FALLBACK;
}
