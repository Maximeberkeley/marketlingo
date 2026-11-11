/**
 * A small, safe reader for the markdown that chat models write: **bold**, *italic* / _italic_, "- " or "• "
 * bullets, "1. " lists and "# " headings. It returns plain blocks and spans for <RichText> to draw, so a
 * reply never shows raw asterisks or underscores. Anything it does not understand stays as plain text.
 */
export interface Span { text: string; bold?: boolean; italic?: boolean }
export type Block =
  | { kind: 'para'; spans: Span[] }
  | { kind: 'heading'; spans: Span[] }
  | { kind: 'bullet'; spans: Span[] }
  | { kind: 'number'; n: number; spans: Span[] };

/** Inline **bold**, __bold__, *italic* and _italic_ (underscores only at word edges, so snake_case survives). */
export function parseInline(text: string): Span[] {
  const spans: Span[] = [];
  // No lookbehind (older Hermes builds reject it): the underscore form captures the character before it instead.
  const re = /(\*\*|__)(.+?)\1|\*(\S(?:[^*]*?\S)?)\*|(^|[^\w])_(\S(?:[^_]*?\S)?)_(?=[^\w]|$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index) });
    if (m[2] !== undefined) spans.push(...parseInline(m[2]).map(s => ({ ...s, bold: true })));
    else if (m[3] !== undefined) spans.push({ text: m[3], italic: true });
    else { if (m[4]) spans.push({ text: m[4] }); spans.push({ text: m[5] as string, italic: true }); }
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last) });
  return merge(spans.map(s => ({ ...s, text: s.text.replace(/`([^`]+)`/g, '$1') })));
}

function merge(spans: Span[]): Span[] {
  const out: Span[] = [];
  for (const s of spans) {
    if (!s.text) continue;
    const prev = out[out.length - 1];
    if (prev && !!prev.bold === !!s.bold && !!prev.italic === !!s.italic) prev.text += s.text;
    else out.push({ ...s });
  }
  return out;
}

export function parseRichText(source: string): Block[] {
  const blocks: Block[] = [];
  const lines = (source || '').replace(/\r\n?/g, '\n').split('\n');
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: 'para', spans: parseInline(para.join(' ').replace(/\s+/g, ' ').trim()) });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const bullet = line.match(/^(?:[-•*]|–)\s+(.*)$/);
    const number = line.match(/^(\d{1,2})[.)]\s+(.*)$/);
    if (heading) { flush(); blocks.push({ kind: 'heading', spans: parseInline(heading[1].replace(/\*\*/g, '')) }); }
    else if (bullet) { flush(); blocks.push({ kind: 'bullet', spans: parseInline(bullet[1]) }); }
    else if (number) { flush(); blocks.push({ kind: 'number', n: Number(number[1]), spans: parseInline(number[2]) }); }
    else para.push(line);
  }
  flush();
  return blocks.filter(b => b.spans.length > 0);
}

/** The text with all markdown removed, for previews, speech and accessibility labels. */
export function plainText(source: string): string {
  return parseRichText(source).map(b => (b.kind === 'number' ? `${b.n}. ` : b.kind === 'bullet' ? '• ' : '') + b.spans.map(s => s.text).join('')).join('\n');
}
