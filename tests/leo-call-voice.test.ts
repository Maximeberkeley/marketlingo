import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const transform = (source: string, loader: string) => execFileSync(process.execPath, ['--input-type=module', '-e',
  `import {transformSync} from 'esbuild'; process.stdout.write(transformSync(${JSON.stringify(source)}, {loader:${JSON.stringify(loader)},jsx:'transform',format:'esm',target:'es2020'}).code);`], { encoding: 'utf8' });
const read = (p: string) => readFileSync(p, 'utf8');

const tts = read('mobile/lib/tts.ts');
const callScreen = read('mobile/app/leo-call.tsx');
const homeCall = read('mobile/components/ai/LeoVoiceChatOverlay.tsx');
const chat = read('mobile/components/ai/AskLeoOverlay.tsx');

describe('a call with Leo is always spoken', () => {
  it('lets calls skip the mute set in the Leo chat', () => {
    expect(tts).toContain('options: { ignoreMute?: boolean } = {},');
    expect(tts).toContain('const chatMuted = () => !options.ignoreMute && isLeoMutedSync();');
    expect(tts).not.toMatch(/\|\| isLeoMutedSync\(\)\)/);
    expect(tts.match(/chatMuted\(\)/g)?.length).toBe(3);
  });

  it('starts the practice call with Leo speaking, not captions only', () => {
    expect(callScreen).not.toContain('voicePrefs');
    expect(callScreen).not.toContain('if (isMuted) setCaptions(true);');
    expect(callScreen).toContain("speakWithElevenLabs(text, LEO_VOICE_ID, 'leo_call', { ignoreMute: true })");
    expect(callScreen).toContain('const [captions, setCaptions] = useState(false);');
  });

  it('starts the Home call unmuted and keeps its mute to that call', () => {
    expect(homeCall).not.toContain('voicePrefs');
    expect(homeCall).toContain('const [isMuted, setIsMuted] = useState(false);');
    expect(homeCall).toMatch(/mutedRef\.current = false;\s+setIsMuted\(false\);/);
    expect(homeCall).toContain("speakWithElevenLabs(text, LEO_VOICE_ID, 'leo_home', { ignoreMute: true })");
    expect(homeCall).not.toContain('setLeoMuted');
  });

  it('still remembers the mute in the Leo chat', () => {
    expect(chat).toContain('await setLeoMuted(next);');
    expect(chat).toContain("speakWithElevenLabs(text, LEO_VOICE_ID, 'leo_chat');");
  });

  it('plays Interview Lab audio when the learner taps to hear Leo', () => {
    expect(read('mobile/lib/interviewVoice.ts')).toContain("speakWithElevenLabs(text, LEO_VOICE_ID, 'leo_interview', { ignoreMute: true })");
  });

  it('has JavaScript copies that match', () => {
    for (const [path, loader] of [['lib/tts', 'ts'], ['lib/interviewVoice', 'ts'], ['app/leo-call', 'tsx'], ['components/ai/LeoVoiceChatOverlay', 'tsx']]) {
      const js = read(`mobile/${path}.js`);
      expect(js, path).toBe(transform(read(`mobile/${path}.${loader}`), loader));
      if (js.includes('React.createElement')) expect(js, path).toMatch(/import React\b/);
    }
  }, 30000);
});
