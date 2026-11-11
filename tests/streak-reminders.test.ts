import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';

const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
function harness(path: string, completed: boolean, offline = false) {
  const now = new Date(2026, 10, 10, 18, 0, 0);
  class Clock extends Date { constructor(value?: any) { super(value ?? now.getTime()); } }
  const saved = new Map<string, string>();
  let scheduled: any[] = [{ identifier: 'legacy', content: { data: { type: 'daily_fallback' } } }];
  let count = 0;
  const notifications = {
    getPermissionsAsync: async () => ({ status: 'granted' }),
    getAllScheduledNotificationsAsync: async () => [...scheduled],
    cancelScheduledNotificationAsync: async (id: string) => { scheduled = scheduled.filter(n => n.identifier !== id); },
    scheduleNotificationAsync: async (item: any) => { const identifier = String(++count); scheduled.push({ ...item, identifier }); return identifier; },
  };
  const query: any = { select: () => query, eq: () => query,
    limit: async () => ({ data: offline ? null : completed ? [{ id: 'max-today' }] : [], error: offline ? new Error('offline') : null }) };
  const imports: Record<string, any> = {
    '@react-native-async-storage/async-storage': { getItem: async (key: string) => saved.get(key), setItem: async (key: string, value: string) => saved.set(key, value), removeItem: async (key: string) => saved.delete(key) },
    './dayMath': { localDateString: (date = now) => dateString(date) },
    './displayName': { normalizeDisplayName: (name: string) => name },
    './logger': { log: { warn() {} } },
    './storage': { storage: { getDisplayName: async () => 'Max', getIndustry: async () => 'aerospace' } },
    './markets': { markets: [{ id: 'aerospace', name: 'Aerospace' }] },
    './supabase': { supabase: { auth: { getUser: async () => ({ data: { user: { id: 'max' } }, error: null }) }, from: () => query } },
    'expo-notifications': notifications,
  };
  const code = execFileSync(process.execPath, ['--input-type=module', '-e',
    `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(readFileSync(path, 'utf8'))}, {loader:'ts',format:'cjs'}).code);`], { encoding: 'utf8' });
  const module = { exports: {} as any };
  runInNewContext(code, { module, exports: module.exports, require: (name: string) => imports[name], Date: Clock, console });
  return { api: module.exports, alerts: () => scheduled };
}

for (const path of ['mobile/lib/leoNudges.ts', 'mobile/lib/leoNudges.js']) {
  describe(path, () => {
    it('does not schedule Nov 10 reminders when Max already completed Nov 10', async () => {
      const h = harness(path, true);
      await h.api.scheduleDailyFallbackReminders();
      const fallbacks = h.alerts().filter(n => n.content.data.type === 'daily_fallback');
      expect(fallbacks).toHaveLength(12);
      expect(fallbacks.some(n => n.content.data.localDate === '2026-11-10')).toBe(false);
      expect(fallbacks.filter(n => n.content.data.localDate === '2026-11-11')).toHaveLength(2);
    });
    it('cancels today on completion while preserving tomorrow even during concurrent app-open scheduling', async () => {
      const h = harness(path, false);
      await Promise.all([h.api.scheduleDailyFallbackReminders(), h.api.cancelRollingLeoNudges()]);
      expect(h.alerts().some(n => n.content.data.localDate === '2026-11-10')).toBe(false);
      expect(h.alerts().filter(n => n.content.data.localDate === '2026-11-11')).toHaveLength(2);
      expect(h.alerts().some(n => n.identifier === 'legacy')).toBe(false);
    });
    it('arms the 20:30 reminder for an unfinished day using a cancellable date', async () => {
      const h = harness(path, false);
      await h.api.scheduleDailyFallbackReminders();
      const today = h.alerts().filter(n => n.content.data.localDate === '2026-11-10');
      expect(today).toHaveLength(1);
      expect(today[0].trigger.getHours()).toBe(20);
      expect(today[0].trigger.getMinutes()).toBe(30);
    });
    it('does not arm today if completion verification fails offline', async () => {
      const h = harness(path, false, true);
      await h.api.scheduleDailyFallbackReminders();
      expect(h.alerts().some(n => n.content.data.localDate === '2026-11-10')).toBe(false);
      expect(h.alerts().filter(n => n.content.data.localDate === '2026-11-11')).toHaveLength(2);
    });
  });
}