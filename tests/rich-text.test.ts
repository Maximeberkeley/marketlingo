import { describe, it, expect } from 'vitest';
import { parseInline, parseRichText, plainText } from '../mobile/lib/richText';

describe('chat markdown', () => {
  it('turns **bold** and _italic_ into spans without the symbols', () => {
    expect(parseInline('**Aerospace Suppliers Push EASA** _Aviationweek_')).toEqual([
      { text: 'Aerospace Suppliers Push EASA', bold: true }, { text: ' ' }, { text: 'Aviationweek', italic: true },
    ]);
    expect(parseInline('a *b* c')).toEqual([{ text: 'a ' }, { text: 'b', italic: true }, { text: ' c' }]);
  });
  it('leaves snake_case, maths and lone asterisks alone', () => {
    expect(parseInline('use market_id here')).toEqual([{ text: 'use market_id here' }]);
    expect(parseInline('2 * 3 = 6')).toEqual([{ text: '2 * 3 = 6' }]);
  });
  it('reads bullets, numbered lists and headings', () => {
    const b = parseRichText('## Why it matters\nIt cuts costs.\n\n- Faster approval\n- Fewer redesigns\n1. First\n2) Second');
    expect(b.map(x => x.kind)).toEqual(['heading', 'para', 'bullet', 'bullet', 'number', 'number']);
    expect(plainText('**Bold** and _it_')).toBe('Bold and it');
  });
  it('the mentor chat draws replies with it and shows the article as a card', () => {
    const src = require('node:fs').readFileSync('mobile/components/ai/MentorChatOverlay.tsx', 'utf8');
    expect(src).toContain('<RichText');
    expect(src).not.toContain('📰 **');
  });
});
