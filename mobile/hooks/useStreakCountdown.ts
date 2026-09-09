import { useState, useEffect } from 'react';

export interface StreakCountdown {
  /** Milliseconds until the streak expires (0 when already gone). */
  msLeft: number;
  hoursLeft: number;
  /** True while the streak can still be saved today. */
  active: boolean;
  /** Last 2 hours — show the big live timer. */
  critical: boolean;
  /** 2–8 hours left — show the warning banner. */
  atRisk: boolean;
  /** "5h 12m" / "48m" / "9:41" in the final hour. */
  label: string;
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h >= 1) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Live countdown to the moment the streak breaks.
 * Ticks every second inside the final two hours, every 30s before that,
 * so the home screen switches into urgency mode on its own.
 */
export function useStreakCountdown(
  expiresAt: string | null | undefined,
  currentStreak: number,
  lessonCompletedToday: boolean,
): StreakCountdown {
  const target = expiresAt ? new Date(expiresAt).getTime() : 0;
  const eligible = !!target && currentStreak > 0 && !lessonCompletedToday;

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!eligible) return;
    const tick = () => setNow(Date.now());
    tick();
    const remaining = target - Date.now();
    const interval = remaining <= 2 * 60 * 60 * 1000 ? 1000 : 30000;
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [eligible, target, Math.floor(Math.max(0, target - now) / (2 * 60 * 60 * 1000))]);

  const msLeft = eligible ? Math.max(0, target - now) : 0;
  const hoursLeft = msLeft / 3600000;

  return {
    msLeft,
    hoursLeft,
    active: eligible && msLeft > 0,
    critical: eligible && msLeft > 0 && hoursLeft <= 2,
    atRisk: eligible && hoursLeft > 2 && hoursLeft <= 8,
    label: formatCountdown(msLeft),
  };
}
