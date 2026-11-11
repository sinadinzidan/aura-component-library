import { useLook } from '../../looks/useLook';
import { cx } from '../tones';

type LoadingBlockProps = {
  /** What is loading, for assistive technology: "Loading gas export". */
  label: string;
  /** The shape of the content that will arrive, so the row does not jump when it does. */
  kind: 'stat' | 'chart' | 'list' | 'table';
  /** Rows of a list or table placeholder. */
  rows?: number;
  className?: string;
};

const BAR = 'block animate-pulse rounded-(--kit-radius-sm) bg-(--kit-track)';

const CHART_HEIGHTS = [38, 52, 46, 64, 58, 72, 61, 80, 69, 55, 63, 74];

/**
 * A placeholder in the shape of the block it stands in for: a figure, a chart, a list or a table.
 * It keeps the height of the loaded block and is announced once as a status.
 */
export function LoadingBlock({ label, kind, rows = 4, className }: LoadingBlockProps) {
  const look = useLook();
  return (
    <div role="status" aria-label={label} aria-busy="true" data-look={look} data-kind={kind} className={cx('flex min-w-0 flex-col gap-3', className)}>
      {kind === 'stat' ? (
        <>
          <span className={cx(BAR, 'h-4 w-24')} />
          <span className={cx(BAR, 'h-9 w-32')} />
          <span className={cx(BAR, 'h-4 w-40')} />
          <span className={cx(BAR, 'h-8 w-full')} />
        </>
      ) : null}
      {kind === 'chart' ? (
        <>
          <span className={cx(BAR, 'h-4 w-48')} />
          <div className="flex h-44 items-end gap-2 border-b border-l border-(--kit-rule) pt-2 pl-2">
            {CHART_HEIGHTS.map((height, index) => (
              <span key={index} className={cx(BAR, 'flex-1 rounded-b-none')} style={{ height: `${height}%` }} />
            ))}
          </div>
        </>
      ) : null}
      {kind === 'list' || kind === 'table'
        ? Array.from({ length: rows }, (_, index) => (
            <div key={index} className="flex items-center gap-3 border-b border-(--kit-rule) pb-3 last:border-b-0">
              {kind === 'list' ? <span className={cx(BAR, 'size-9 shrink-0')} /> : null}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <span className={cx(BAR, 'h-4')} style={{ width: `${68 - (index % 3) * 14}%` }} />
                {kind === 'list' ? <span className={cx(BAR, 'h-3 w-2/5')} /> : null}
              </div>
              <span className={cx(BAR, 'h-4 w-14 shrink-0')} />
              {kind === 'table' ? <span className={cx(BAR, 'h-4 w-20 shrink-0')} /> : null}
            </div>
          ))
        : null}
    </div>
  );
}
