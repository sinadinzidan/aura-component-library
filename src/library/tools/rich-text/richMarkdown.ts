export type RichInline =
  | { type: 'text'; text: string }
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; url: string }
  | { type: 'mention'; text: string }
  | { type: 'tag'; text: string };

export type RichListItem = { text: string; checked: boolean | null; children: RichListItem[]; ordered: boolean };

export type RichBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: RichListItem[] }
  | { type: 'quote'; text: string }
  | { type: 'code'; text: string }
  | { type: 'rule' };

export type InlineOptions = {
  /** Names that count as a mention after `@`, for example every person in the project. */
  mentions?: readonly string[];
};

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Splits one line into runs: bold `**x**`, italic `_x_`, code `` `x` ``, links `[text](https://…)`,
 * mentions `@Known Name` and tags `#23-KA-9101`. Links with any other scheme stay plain text.
 */
export function parseRichInline(text: string, options: InlineOptions = {}): RichInline[] {
  const names = [...(options.mentions ?? [])].sort((a, b) => b.length - a.length).map(escapeRegExp);
  const mention = names.length > 0 ? `|@(?:${names.join('|')})(?![\\p{L}\\p{N}])` : '';
  const pattern = new RegExp(
    `(\`[^\`]+\`|\\*\\*[^*]+\\*\\*|\\[[^\\]]+\\]\\([^)\\s]+\\)|(?<![\\p{L}\\p{N}])_[^_]+_(?![\\p{L}\\p{N}])|(?<![\\p{L}\\p{N}&])#[\\p{L}\\p{N}][\\p{L}\\p{N}-]*${mention})`,
    'u'
  );
  const runs: RichInline[] = [];
  // `split` with one capture group alternates plain text (even) and matches (odd).
  text.split(pattern).forEach((part, index) => {
    if (part === undefined || part === '') return;
    if (index % 2 === 0) runs.push({ type: 'text', text: part });
    else if (part.startsWith('`')) runs.push({ type: 'code', text: part.slice(1, -1) });
    else if (part.startsWith('**')) runs.push({ type: 'bold', text: part.slice(2, -2) });
    else if (part.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
      if (link && /^(https:\/\/|mailto:)/i.test(link[2])) runs.push({ type: 'link', text: link[1], url: link[2] });
      else runs.push({ type: 'text', text: link ? link[1] : part });
    } else if (part.startsWith('_')) runs.push({ type: 'italic', text: part.slice(1, -1) });
    else if (part.startsWith('#')) runs.push({ type: 'tag', text: part.slice(1) });
    else runs.push({ type: 'mention', text: part.slice(1) });
  });
  return runs;
}

const LIST_LINE = /^(\s*)(?:([-*]) \[([ xX])\] |([-*]) |(\d+)[.)] )(.*)$/;
const BLOCK_START = /^(#{1,3} |\s*[-*] |\s*\d+[.)] |>|```|(?:-{3,}|\*{3,})\s*$)/;

type FlatItem = { depth: number; ordered: boolean; checked: boolean | null; text: string };

function nest(flat: readonly FlatItem[]): RichListItem[] {
  const root: RichListItem[] = [];
  const stack: { depth: number; items: RichListItem[] }[] = [{ depth: flat[0]?.depth ?? 0, items: root }];
  let last: RichListItem | null = null;
  for (const entry of flat) {
    while (stack.length > 1 && entry.depth < stack[stack.length - 1].depth) stack.pop();
    if (entry.depth > stack[stack.length - 1].depth && last) {
      stack.push({ depth: entry.depth, items: last.children });
    }
    const item: RichListItem = { text: entry.text, checked: entry.checked, children: [], ordered: entry.ordered };
    stack[stack.length - 1].items.push(item);
    last = item;
  }
  return root;
}

/**
 * Reads the Markdown the editor writes into blocks: three heading levels, paragraphs, bullet,
 * numbered and check lists with nesting, quotes, fenced code and horizontal rules. It produces
 * data, never HTML, so a preview can render what people type without injecting markup.
 */
export function parseRichMarkdown(source: string): RichBlock[] {
  const blocks: RichBlock[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length) {
    const raw = lines[index];
    const line = raw.trim();
    const heading = /^(#{1,3}) +(.*)$/.exec(line);

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
    } else if (/^(-{3,}|\*{3,})$/.test(line)) {
      blocks.push({ type: 'rule' });
      index += 1;
    } else if (heading) {
      const level = heading[1].length === 1 ? 1 : heading[1].length === 2 ? 2 : 3;
      blocks.push({ type: 'heading', level, text: heading[2].trim() });
      index += 1;
    } else if (LIST_LINE.test(raw)) {
      const flat: FlatItem[] = [];
      for (let match = LIST_LINE.exec(lines[index] ?? ''); match !== null; match = LIST_LINE.exec(lines[index] ?? '')) {
        flat.push({
          depth: Math.floor(match[1].replace(/\t/g, '  ').length / 2),
          ordered: match[5] !== undefined,
          checked: match[3] === undefined ? null : match[3] !== ' ',
          text: match[6].trim(),
        });
        index += 1;
      }
      blocks.push({ type: 'list', ordered: flat[0].ordered, items: nest(flat) });
    } else if (line.startsWith('>')) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quote.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }
      blocks.push({ type: 'quote', text: quote.join(' ').trim() });
    } else {
      const text: string[] = [];
      while (index < lines.length && lines[index].trim() !== '' && !BLOCK_START.test(lines[index].trim())) {
        text.push(lines[index].trim());
        index += 1;
      }
      if (text.length === 0) {
        // A line that looks like a block start but is not one (for example `#tag`) is text.
        text.push(line);
        index += 1;
      }
      blocks.push({ type: 'paragraph', text: text.join(' ') });
    }
  }

  return blocks;
}

/** The text of a note without its Markdown, for a one-line excerpt or a search index. */
export function plainText(source: string): string {
  const inline = (text: string) =>
    parseRichInline(text)
      .map((run) => run.text)
      .join('');
  const items = (list: readonly RichListItem[]): string[] => list.flatMap((item) => [inline(item.text), ...items(item.children)]);
  return parseRichMarkdown(source)
    .flatMap((block) => {
      if (block.type === 'rule') return [];
      if (block.type === 'list') return items(block.items);
      return [block.type === 'code' ? block.text : inline(block.text)];
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}
