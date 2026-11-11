import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

export type HourRow = {
  /** The hour slot: "06–07". */
  hour: string;
  plan: number;
  /** `null` for hours that have not run yet. */
  actual: number | null;
  /** Why the hour missed, written by the team lead. */
  note?: string;
};

type HourBoardProps = {
  /** Accessible name: "Line 2 hour by hour". */
  label: string;
  rows: readonly HourRow[];
  /** The slot that is running now. */
  current?: string;
  unit?: string;
  className?: string;
};

/**
 * The hour-by-hour board of a production line: plan, actual and the gap for every hour of the
 * shift, with the gap cell filled green or red and the reason written next to a miss.
 */
export function HourBoard({ label, rows, current, unit = 'units', className }: HourBoardProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  const done = rows.filter((row) => row.actual !== null);
  const planned = done.reduce((sum, row) => sum + row.plan, 0);
  const made = done.reduce((sum, row) => sum + (row.actual ?? 0), 0);

  return (
    <table aria-label={label} data-look={look} className={cx('w-full border-separate border-spacing-y-1 text-base text-(--kit-text) tabular-nums', className)}>
      <thead>
        <tr className="text-left text-sm font-medium text-(--kit-text-2)">
          <th scope="col" className="px-3 py-1 font-medium">
            Hour
          </th>
          <th scope="col" className="px-3 py-1 text-right font-medium">
            Plan
          </th>
          <th scope="col" className="px-3 py-1 text-right font-medium">
            Actual
          </th>
          <th scope="col" className="w-24 px-3 py-1 text-right font-medium">
            Gap
          </th>
          <th scope="col" className="px-3 py-1 font-medium">
            Note
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const gap = row.actual === null ? null : row.actual - row.plan;
          const now = row.hour === current;
          return (
            <tr key={row.hour} data-current={now} className={cx(now ? 'bg-(--kit-track) font-semibold' : '')}>
              <th scope="row" className={cx('px-3 py-2 text-left font-semibold whitespace-nowrap', square ? '' : 'rounded-l-(--kit-radius-sm)')}>
                {row.hour}
                {now ? <span className="ml-2 text-sm font-medium text-(--kit-text-2)">now</span> : null}
              </th>
              <td className="px-3 py-2 text-right">{formatNumber(row.plan)}</td>
              <td className="px-3 py-2 text-right text-xl leading-6 font-semibold">{row.actual === null ? '—' : formatNumber(row.actual)}</td>
              <td className="p-0 text-right">
                {gap === null ? (
                  <span className="block px-3 py-2 text-(--kit-text-3)">—</span>
                ) : (
                  <span data-tone={gap >= 0 ? 'success' : 'critical'} className={cx('block bg-(--t-solid) px-3 py-2 font-semibold text-(--t-on-solid)', square ? '' : 'rounded-(--kit-radius-sm)')}>
                    {gap > 0 ? '+' : gap < 0 ? '−' : '±'}
                    {formatNumber(Math.abs(gap))}
                  </span>
                )}
              </td>
              <td className={cx('px-3 py-2 text-sm font-normal text-(--kit-text-2)', square ? '' : 'rounded-r-(--kit-radius-sm)')}>{row.note ?? ''}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot>
        <tr className="text-base font-semibold">
          <th scope="row" className="px-3 pt-3 text-left">
            Shift so far
          </th>
          <td className="px-3 pt-3 text-right">{formatNumber(planned)}</td>
          <td className="px-3 pt-3 text-right text-xl leading-6">{formatNumber(made)}</td>
          <td className="px-3 pt-3 text-right">
            {made - planned > 0 ? '+' : made - planned < 0 ? '−' : '±'}
            {formatNumber(Math.abs(made - planned))}
          </td>
          <td className="px-3 pt-3 text-sm font-normal text-(--kit-text-2)">{unit}</td>
        </tr>
      </tfoot>
    </table>
  );
}
