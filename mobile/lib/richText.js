function parseInline(text) {
  const spans = [];
  const re = /(\*\*|__)(.+?)\1|\*(\S(?:[^*]*?\S)?)\*|(^|[^\w])_(\S(?:[^_]*?\S)?)_(?=[^\w]|$)/g;
  let last = 0;
  let m;
  while (m = re.exec(text)) {
    if (m.index > last) spans.push({ text: text.slice(last, m.index) });
    if (m[2] !== void 0) spans.push(...parseInline(m[2]).map((s) => ({ ...s, bold: true })));
    else if (m[3] !== void 0) spans.push({ text: m[3], italic: true });
    else {
      if (m[4]) spans.push({ text: m[4] });
      spans.push({ text: m[5], italic: true });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push({ text: text.slice(last) });
  return merge(spans.map((s) => ({ ...s, text: s.text.replace(/`([^`]+)`/g, "$1") })));
}
function merge(spans) {
  const out = [];
  for (const s of spans) {
    if (!s.text) continue;
    const prev = out[out.length - 1];
    if (prev && !!prev.bold === !!s.bold && !!prev.italic === !!s.italic) prev.text += s.text;
    else out.push({ ...s });
  }
  return out;
}
function parseRichText(source) {
  const blocks = [];
  const lines = (source || "").replace(/\r\n?/g, "\n").split("\n");
  let para = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "para", spans: parseInline(para.join(" ").replace(/\s+/g, " ").trim()) });
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const bullet = line.match(/^(?:[-•*]|–)\s+(.*)$/);
    const number = line.match(/^(\d{1,2})[.)]\s+(.*)$/);
    if (heading) {
      flush();
      blocks.push({ kind: "heading", spans: parseInline(heading[1].replace(/\*\*/g, "")) });
    } else if (bullet) {
      flush();
      blocks.push({ kind: "bullet", spans: parseInline(bullet[1]) });
    } else if (number) {
      flush();
      blocks.push({ kind: "number", n: Number(number[1]), spans: parseInline(number[2]) });
    } else para.push(line);
  }
  flush();
  return blocks.filter((b) => b.spans.length > 0);
}
function plainText(source) {
  return parseRichText(source).map((b) => (b.kind === "number" ? `${b.n}. ` : b.kind === "bullet" ? "\u2022 " : "") + b.spans.map((s) => s.text).join("")).join("\n");
}
export {
  parseInline,
  parseRichText,
  plainText
};
