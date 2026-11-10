import { IconArrowRight } from '@cognite/aura/icons';

export type DiffValueProps = {
  /** The old value. Leave out for a value that is new. */
  before?: string;
  /** The new value. Leave out for a value that was removed. */
  after?: string;
  /** Printed once after the values. */
  unit?: string;
  /** `stacked` puts the new value under the old one, for long text in narrow columns. */
  layout?: 'inline' | 'stacked';
  /** Monospace, for tags, ids and config values. */
  mono?: boolean;
};

/**
 * A before → after pair on one line: the old value struck through, an arrow, the new value in
 * full weight. Uses `del` and `ins`, so the change is announced as well as shown. An unchanged
 * value prints once; a value on only one side prints as added or removed.
 */
export function DiffValue({ before, after, unit, layout = 'inline', mono = false }: DiffValueProps) {
  const font = mono ? 'font-mono' : '';
  const unitText = unit ? <span className="font-normal text-muted-foreground"> {unit}</span> : null;

  if (before === after) {
    return (
      <span data-slot="diff-value" data-change="unchanged" className={`text-sm tabular-nums text-base-foreground ${font}`}>
        {before ?? '—'}
        {before === undefined ? null : unitText}
      </span>
    );
  }

  return (
    <span
      data-slot="diff-value"
      data-change={before === undefined ? 'added' : after === undefined ? 'removed' : 'changed'}
      className={`inline-flex min-w-0 text-sm tabular-nums ${font} ${layout === 'stacked' ? 'flex-col items-start gap-0.5' : 'flex-wrap items-baseline gap-x-1.5'}`}
    >
      {before === undefined ? null : (
        <del className="text-muted-foreground line-through">
          <span className="sr-only">Was </span>
          {before}
        </del>
      )}
      {before !== undefined && after !== undefined && layout === 'inline' ? <IconArrowRight aria-hidden="true" className="size-3.5 shrink-0 self-center text-muted-foreground" /> : null}
      {after === undefined ? (
        <span className="text-xs text-muted-foreground">removed</span>
      ) : (
        <ins className="font-medium text-base-foreground no-underline">
          <span className="sr-only">{before === undefined ? 'New ' : 'Now '}</span>
          {after}
          {unitText}
        </ins>
      )}
    </span>
  );
}
