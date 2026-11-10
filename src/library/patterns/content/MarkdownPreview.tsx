import type { ReactNode } from 'react';

import { parseInline, parseMarkdown } from './parseMarkdown';
import { Prose } from './Prose';

type MarkdownPreviewProps = {
  /** Markdown as typed. Only the subset `parseMarkdown` knows is formatted. */
  source: string;
  /** Shown when the source has no content. */
  emptyText?: string;
  size?: 'sm' | 'base';
};

function inline(text: string): ReactNode[] {
  return parseInline(text).map((run, index) => {
    if (run.style === 'bold') return <strong key={index}>{run.text}</strong>;
    if (run.style === 'italic') return <em key={index}>{run.text}</em>;
    if (run.style === 'code') return <code key={index}>{run.text}</code>;
    return run.text;
  });
}

/**
 * Renders a note written in Markdown as token-styled prose. The text is turned into React
 * elements, never into HTML, so whatever people type or paste cannot inject markup. For the
 * preview side of an editor and for notes stored as Markdown.
 */
export function MarkdownPreview({ source, emptyText = 'Nothing to preview yet.', size = 'sm' }: MarkdownPreviewProps) {
  const blocks = parseMarkdown(source);

  if (blocks.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;

  return (
    <Prose size={size}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return block.level === 2 ? <h2 key={index}>{inline(block.text)}</h2> : <h3 key={index}>{inline(block.text)}</h3>;
          case 'list': {
            const items = block.items.map((item, itemIndex) => <li key={itemIndex}>{inline(item)}</li>);
            return block.ordered ? <ol key={index}>{items}</ol> : <ul key={index}>{items}</ul>;
          }
          case 'quote':
            return <blockquote key={index}>{inline(block.text)}</blockquote>;
          case 'code':
            return (
              <pre key={index}>
                <code>{block.text}</code>
              </pre>
            );
          case 'paragraph':
            return <p key={index}>{inline(block.text)}</p>;
        }
      })}
    </Prose>
  );
}
