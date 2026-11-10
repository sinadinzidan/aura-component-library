export type MarkdownInline = { text: string; style: 'plain' | 'bold' | 'italic' | 'code' };

export type MarkdownBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string };

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|_[^_]+_)/;

/** Splits one line of text into plain, bold (`**x**`), italic (`_x_`) and code (`` `x` ``) runs. */
export function parseInline(text: string): MarkdownInline[] {
  return text
    .split(INLINE)
    .filter((part) => part !== '')
    .map((part): MarkdownInline => {
      if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return { text: part.slice(2, -2), style: 'bold' };
      if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) return { text: part.slice(1, -1), style: 'code' };
      if (part.length > 2 && part.startsWith('_') && part.endsWith('_')) return { text: part.slice(1, -1), style: 'italic' };
      return { text: part, style: 'plain' };
    });
}

const BULLET = /^[-*]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;

/**
 * Reads the small part of Markdown that notes use (headings, paragraphs, bullet and numbered
 * lists, quotes, fenced code) into blocks. It produces data, never HTML, so a preview can render
 * what people type without injecting markup. Anything it does not know stays a paragraph.
 */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let index = 0;

  const collect = (pattern: RegExp): string[] => {
    const items: string[] = [];
    for (let match = pattern.exec(lines[index] ?? ''); match !== null; match = pattern.exec(lines[index] ?? '')) {
      items.push(match[1].trim());
      index += 1;
    }
    return items;
  };

  while (index < lines.length) {
    const line = lines[index].trim();

    if (line === '') {
      index += 1;
    } else if (line.startsWith('```')) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push({ type: 'code', text: code.join('\n') });
    } else if (line.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 3, text: line.slice(3).trim() });
      index += 1;
    } else if (line.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 2, text: line.slice(2).trim() });
      index += 1;
    } else if (BULLET.test(line)) {
      blocks.push({ type: 'list', ordered: false, items: collect(/^\s*[-*]\s+(.*)$/) });
    } else if (NUMBERED.test(line)) {
      blocks.push({ type: 'list', ordered: true, items: collect(/^\s*\d+[.)]\s+(.*)$/) });
    } else if (line.startsWith('>')) {
      blocks.push({ type: 'quote', text: collect(/^\s*>\s?(.*)$/).join(' ') });
    } else {
      const text: string[] = [];
      while (index < lines.length && lines[index].trim() !== '' && !/^(#{1,2}\s|[-*]\s|\d+[.)]\s|>|```)/.test(lines[index].trim())) {
        text.push(lines[index].trim());
        index += 1;
      }
      blocks.push({ type: 'paragraph', text: text.join(' ') });
    }
  }

  return blocks;
}
