import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { NUDGE_MESSAGES, nudgeOptions } from '../mobile/lib/nudges';
import { inviteShareContent, inviteMessage } from '../mobile/lib/inviteLinks';
import { qrcodegen } from '../mobile/lib/vendor/qrcodegen';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');
const friends = read('mobile/app/friends.tsx');

describe('nudges', () => {
  it('lead with your shared streak or race, then fill with general ones, four at most', () => {
    expect(nudgeOptions()).toEqual(['leo_pacing', 'friendly_warning', 'coffee', 'market_moved']);
    expect(nudgeOptions({ streakLength: 6, meDoneToday: true })).toEqual(['streak_my_part', 'leo_pacing', 'friendly_warning', 'coffee']);
    expect(nudgeOptions({ streakLength: 3, meDoneToday: false, raceLead: 40 })).toEqual(['streak_shivering', 'race_ahead', 'leo_pacing', 'friendly_warning']);
    expect(nudgeOptions({ raceLead: -9 })[0]).toBe('race_behind');
    expect(nudgeOptions({ raceLead: 0 })[0]).toBe('race_tied');
  });

  it('send only messages from a list the server keeps word for word', () => {
    const server = read('supabase/functions/send-nudge/index.ts');
    const block = server.slice(server.indexOf('const MESSAGES'), server.indexOf('};', server.indexOf('const MESSAGES')));
    for (const [id, text] of Object.entries(NUDGE_MESSAGES)) {
      expect(block, id).toContain(`${id}: ${JSON.stringify(text).replace(/^"|"$/g, text.includes("'") ? '"' : "'")}`);
    }
    expect(block.match(/^\s+\w+: /gm)?.length).toBe(Object.keys(NUDGE_MESSAGES).length);
    expect(server).toContain("Object.prototype.hasOwnProperty.call(MESSAGES, messageId)");
    expect(server).toContain("typeof messageId === 'string' ? MESSAGES[messageId] : BODIES[");
  });

  it('opens a sheet to pick the message instead of sending on tap', () => {
    expect(friends).not.toContain('handleNudge');
    expect(friends).toContain("supabase.functions.invoke('send-nudge', { body: { friendId, message } })");
    expect(friends).toContain('onNudge={row.friend ? () => openNudge(row.friend!.id) : undefined}');
    expect(friends).toContain('onNudge={() => openNudge(race.friend_id)}');
    expect(friends).toContain('<NudgeSheet target={nudgeTarget} onSend={sendNudge} onClose={() => setNudgeTarget(null)} />');
  });
});

describe('Friends tab layout', () => {
  it('keeps rows clean: tap a friend for actions, search and codes live in their own sheets', () => {
    expect(friends).toContain('onPress={row.friend ? () => { triggerHaptic(\'light\'); setFriendSheetId(row.friend!.id); } : undefined}');
    for (const gone of ['Add friends by name or code', 'Got an invite code?', 'Hold the code to copy it.', 'YOUR FRIEND CODE', 'moreBtn']) {
      expect(friends, gone).not.toContain(gone);
    }
    for (const sheet of ['<FriendSheet', '<FindFriendsSheet', '<MyCodeSheet', '<AddFriendsCard']) expect(friends, sheet).toContain(sheet);
  });

  it('accepts a friend’s race or streak invite straight from their card', () => {
    expect(friends).toContain("if (taken === 'Challenged you') return { label: 'Accept race', enabled: true };");
    expect(friends).toContain("if (taken === 'Invited you') return { label: 'Accept streak', enabled: true };");
  });

  it('shows your own initial on your avatars instead of Y', () => {
    expect(read('mobile/components/social/RaceCard.tsx')).toContain("<SocialAvatar name={meName?.trim() || 'You'}");
    expect(read('mobile/components/social/StreakSheet.tsx')).toContain("<SocialAvatar name={meName?.trim() || 'You'}");
    expect(friends).toContain('avatarName={row.isMe ? myName : undefined}');
    expect(friends.match(/meName=\{myName\}/g)?.length).toBe(2);
  });
});

describe('sharing your invite', () => {
  it('gives iPhone a tappable link card and keeps the code in the text', () => {
    expect(inviteShareContent('Aerospace', 'MAX4TQ', 'ios')).toEqual({
      message: "Add me on MarketLingo! I'm learning Aerospace, 5 minutes a day. My friend code: MAX4TQ",
      url: 'https://market-verse.com/invite/MAX4TQ',
    });
    expect(inviteShareContent('Aerospace', 'MAX4TQ', 'android')).toEqual({ message: inviteMessage('Aerospace', 'MAX4TQ') });
    expect(inviteMessage(null, 'MAX4TQ')).toContain('https://market-verse.com/invite/MAX4TQ (or enter my friend code MAX4TQ)');
  });

  it('draws a scannable QR of the invite link', () => {
    const qr = qrcodegen.QrCode.encodeText('https://market-verse.com/invite/MAX4TQ', qrcodegen.QrCode.Ecc.MEDIUM);
    expect(qr.size).toBe(29);
    for (const [x, y] of [[0, 0], [qr.size - 1, 0], [0, qr.size - 1]]) expect(qr.getModule(x, y)).toBe(true);
    expect(read('mobile/components/social/MyCodeSheet.tsx')).toContain('<QRCode value={inviteUrl(code)} size={208} />');
  });
});

describe('pushes for friend streaks and races', () => {
  const fn = read('supabase/functions/friend-social-notify/index.ts');
  it('checks the caller’s role on the row before notifying the other person, once', () => {
    expect(fn).toContain("if (row.invited_by !== callerId || row.status !== 'pending') return json({ error: 'Forbidden' }, 403);");
    expect(fn).toContain("} else if (row.invited_by === callerId || row.status !== 'active') {");
    expect(fn).toContain("if (row.challenger !== callerId || row.status !== 'pending') return json({ error: 'Forbidden' }, 403);");
    expect(fn).toContain("if (row.opponent !== callerId || row.status !== 'active') return json({ error: 'Forbidden' }, 403);");
    expect(fn).toContain(".from('friend_social_notifications')");
    expect(fn).toContain("if (recordError.code === '23505') return json({ status: 'already' });");
    expect(fn).toContain('prefs.friends === false');
    expect(fn).toContain("select('display_name')");
    expect(fn).not.toMatch(/select\([^)]*(username|email)/);
  });

  it('is called after each invite, challenge and accept succeeds', () => {
    const hook = read('mobile/hooks/useFriendSocial.ts');
    expect(hook).toContain("if (!result.error) notifyFriendSocial('streak_invite', result.data);");
    expect(hook).toContain("if (!result.error && accept) notifyFriendSocial('streak_accepted', streakId);");
    expect(hook).toContain("if (!result.error) notifyFriendSocial('race_challenge', result.data);");
    expect(hook).toContain("if (!result.error && accept) notifyFriendSocial('race_accepted', raceId);");
  });

  it('keeps one row per push in a table only the server can write', () => {
    const sql = read('drizzle/migrations/0027_friend_social_notifications.sql');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.friend_social_notifications');
    expect(sql).toContain('PRIMARY KEY (subject_id, kind)');
    expect(sql).toContain('ALTER TABLE public.friend_social_notifications ENABLE ROW LEVEL SECURITY;');
    expect(sql).toContain('REVOKE ALL ON public.friend_social_notifications FROM anon, authenticated;');
    expect(read('drizzle/migrations/meta/_journal.json')).toContain('"tag": "0027_friend_social_notifications"');
  });
});

describe('Arena loading', () => {
  it('alternates Leo’s two arena-setup takes while the questions load', () => {
    const arena = read('mobile/app/arena.tsx');
    expect(arena).toContain("const ARENA_SETUP_CLIPS = ['leo-arena-setup-a', 'leo-arena-setup-b'] as const;");
    expect(arena).toContain('clip={ARENA_SETUP_CLIPS[take % 2]}');
    expect(arena).toContain('onEnd={() => setTake(t => t + 1)}');
    expect(arena).toContain('if (busy) return <ArenaSetup />;');
    for (const clip of ['leo-arena-setup-a', 'leo-arena-setup-b']) {
      expect(statSync(`mobile/assets/mascot/anim/${clip}.webp`).size).toBeGreaterThan(100_000);
    }
    expect(existsSync('mobile/assets/mascot/leo-arena-setup.png')).toBe(true);
  });
});

describe('JavaScript copies for the Friends redesign', () => {
  it('match their source and import React when they use it', () => {
    for (const [path, loader] of [
      ['lib/nudges', 'ts'], ['lib/invites', 'ts'], ['lib/inviteLinks', 'ts'], ['lib/vendor/qrcodegen', 'ts'], ['hooks/useFriendSocial', 'ts'],
      ['components/social/ChunkyButton', 'tsx'], ['components/social/NudgeSheet', 'tsx'], ['components/social/FriendSheet', 'tsx'],
      ['components/social/QRCode', 'tsx'], ['components/social/MyCodeSheet', 'tsx'], ['components/social/AddFriendsCard', 'tsx'],
      ['components/social/FindFriendsSheet', 'tsx'], ['components/social/RaceCard', 'tsx'], ['components/social/StreakSheet', 'tsx'],
      ['components/mascot/leoClips', 'ts'], ['app/friends', 'tsx'], ['app/arena', 'tsx'],
    ]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  }, 60000);
});
