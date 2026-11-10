import { wordDiff } from './wordDiff';

export type TextDiffProps = {
  before: string;
  after: string;
  /** `inline` shows one text with both sides marked; `after` hides the removed words. */
  show?: 'inline' | 'after';
  /** Accessible name: "Changes to step 4". */
  label?: string;
};

/**
 * Two versions of a sentence or paragraph as one text, with the removed words struck through and
 * the added words underlined. Built on `wordDiff`; uses `del` and `ins`, and never relies on the
 * tint alone.
 */
export function TextDiff({ before, after, show = 'inline', label }: TextDiffProps) {
  const segments = wordDiff(before, after).filter((segment) => show === 'inline' || segment.type !== 'removed');

  return (
    <p data-slot="text-diff" aria-label={label} className="text-sm leading-6 text-base-foreground">
      {segments.map((segment, index) => {
        const space = index < segments.length - 1 ? ' ' : '';
        if (segment.type === 'removed') {
          return (
            <span key={index}>
              <del className="rounded-sm bg-critical-background px-0.5 text-critical-foreground line-through">{segment.text}</del>
              {space}
            </span>
          );
        }
        if (segment.type === 'added') {
          return (
            <span key={index}>
              <ins className="rounded-sm bg-success-background px-0.5 text-success-foreground underline">{segment.text}</ins>
              {space}
            </span>
          );
        }
        return (
          <span key={index}>
            {segment.text}
            {space}
          </span>
        );
      })}
    </p>
  );
}
