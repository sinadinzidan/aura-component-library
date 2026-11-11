import type { ReactNode } from 'react';

import { Prose } from '../../patterns/content/Prose';

import { parseRichInline, parseRichMarkdown } from './richMarkdown';
import type { RichListItem } from './richMarkdown';

type RichTextPreviewProps = {
  /** Markdown as typed. */
  source: string;
  /** Names that render as a mention after `@`. */
  mentions?: readonly string[];
  /** Shown when the source has no content. */
  emptyText?: string;
  size?: 'sm' | 'base';
};

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-sm border ${checked ? 'border-transparent bg-neutral-foreground-strong' : 'border-emphasized'}`}
      >
        {checked ? (
          <svg viewBox="0 0 16 16" className="size-3 fill-none stroke-base-background" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3.5 8.5l3 3 6-7" />
          </svg>
        ) : null}
      </span>
      <span className="sr-only">{checked ? 'Done: ' : 'To do: '}</span>
    </>
  );
}

/**
 * Renders the Markdown an editor writes as token-styled prose: headings, lists with nesting and
 * check items, quotes, code, rules, links, mentions and tags. The text becomes React elements,
 * never HTML, so whatever people type or paste cannot inject markup.
 */
export function RichTextPreview({ source, mentions, emptyText = 'Nothing to preview yet.', size = 'sm' }: RichTextPreviewProps) {
  const blocks = parseRichMarkdown(source);

  const inline = (text: string): ReactNode[] =>
    parseRichInline(text, { mentions }).map((run, index) => {
      switch (run.type) {
        case 'bold':
          return <strong key={index}>{run.text}</strong>;
        case 'italic':
          return <em key={index}>{run.text}</em>;
        case 'code':
          return <code key={index}>{run.text}</code>;
        case 'link':
          return (
            <a key={index} href={run.url} target="_blank" rel="noreferrer noopener">
              {run.text}
            </a>
          );
        case 'mention':
          return (
            <span key={index} data-slot="mention" className="rounded-sm bg-medium-background px-1 py-0.5 font-medium">
              @{run.text}
            </span>
          );
        case 'tag':
          return (
            <span key={index} data-slot="tag" className="rounded-sm border border-default px-1 py-0.5 font-mono text-xs">
              #{run.text}
            </span>
          );
        case 'text':
          return run.text;
      }
    });

  const list = (items: readonly RichListItem[], ordered: boolean, key?: number): ReactNode => {
    const checks = items.every((item) => item.checked !== null);
    const rows = items.map((item, index) => (
      <li key={index} className={checks ? 'flex! flex-wrap items-start gap-x-2 pl-0!' : undefined}>
        {item.checked !== null && checks ? <CheckMark checked={item.checked} /> : null}
        <span className={checks ? 'min-w-0 flex-1' : undefined}>{inline(item.text)}</span>
        {item.children.length > 0 ? <div className="w-full pl-6">{list(item.children, item.children[0].ordered)}</div> : null}
      </li>
    ));
    if (checks) {
      return (
        <ul key={key} className="list-none! pl-0!">
          {rows}
        </ul>
      );
    }
    return ordered ? <ol key={key}>{rows}</ol> : <ul key={key}>{rows}</ul>;
  };

  if (blocks.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;

  return (
    <Prose size={size}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            if (block.level === 1) return <h2 key={index}>{inline(block.text)}</h2>;
            return block.level === 2 ? <h3 key={index}>{inline(block.text)}</h3> : <h4 key={index}>{inline(block.text)}</h4>;
          case 'list':
            return list(block.items, block.ordered, index);
          case 'quote':
            return <blockquote key={index}>{inline(block.text)}</blockquote>;
          case 'code':
            return (
              <pre key={index}>
                <code>{block.text}</code>
              </pre>
            );
          case 'rule':
            return <hr key={index} />;
          case 'paragraph':
            return <p key={index}>{inline(block.text)}</p>;
        }
      })}
    </Prose>
  );
}
