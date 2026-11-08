import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');
const profile = read('mobile/app/(tabs)/profile.tsx');
const card = read('mobile/components/profile/ProfileFriendsCard.tsx');

describe('Profile redesign', () => {
  it('leads with one clean card: avatar, name, industry, and a QR button for your code', () => {
    expect(profile).toContain("<SocialAvatar name={displayName || user?.email || 'You'} size={60} ring={COLORS.accent} ringWidth={3} />");
    expect(profile).toContain('{iWearCrown && <View style={styles.avatarCrown} pointerEvents="none"><CrownBadge size={28} /></View>}');
    expect(profile).toContain('<View style={styles.idCard}>');
    expect(profile).toContain('<TouchableOpacity style={styles.qrBtn} onPress={openCode}');
    // The old clutter: the goal sentence with "· Change" (Industry is under Your learning) and the # code chip.
    for (const gone of ['· Change', 'goalSentence', 'codeChip', 'name="hash"']) expect(profile, gone).not.toContain(gone);
    expect(profile).toContain("select('selected_market, familiarity_level, display_name')");
    expect(profile).toContain('<MyCodeSheet code={friendsData.myFriendCode} visible={codeOpen}');
    expect(profile).not.toContain('{user && <Text style={styles.email}>{user.email}</Text>}');
  });

  it('goes straight from you to Friends to the interview, with no stat tiles', () => {
    for (const gone of ['StatTile', 'Day streak', 'Total XP', 'XP this month', 'Among friends']) expect(profile, gone).not.toContain(gone);
    const order = ['<SocialAvatar name={displayName', '<ProfileFriendsCard', '<InterviewTargetForm', 'title="Goal"'].map(t => profile.indexOf(t));
    expect(order.every(i => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('showcases Friends with King Leo, the crown, friends, streaks, races and what needs you', () => {
    expect(profile).toContain('<ProfileFriendsCard');
    expect(profile).toContain('crown: friendsData.friends.length > 0 ? crownStatus(board) : null,');
    expect(profile).toContain('urgent: social.available ? homeSocialLine(social.social) : null,');
    expect(card).toContain('<LeoAnimated clip="leo-king" size={92} fallback={LEO_KING} />');
    expect(card).toContain("{info.streaks.active > 0 ? `${info.streaks.lit} of ${info.streaks.active} streaks lit` : 'Start a friend streak'}");
    expect(card).toContain('label="Open Friends"');
  });

  it('groups the rest, with Achievements as a real row and no League', () => {
    for (const row of ['title="Goal"', 'title="Level"', 'title="Industry"', 'title="Achievements"', 'title="Settings"', 'title="Interview Brief"']) {
      expect(profile, row).toContain(row);
    }
    expect(profile).not.toContain('League');
  });

  it('has JavaScript copies that match', () => {
    for (const [path, loader] of [['app/(tabs)/profile', 'tsx'], ['components/profile/ProfileFriendsCard', 'tsx']]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  }, 30000);
});
