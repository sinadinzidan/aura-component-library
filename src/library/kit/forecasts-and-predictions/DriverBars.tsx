import { useLook } from '../../looks/useLook';
import { cx, formatNumber } from '../tones';

export type Driver = {
  label: string;
  /** Signed contribution to the prediction, in the unit given. Positive pushes it up. */
  impact: number;
  /** The reading behind it: "6.8 mm/s, rising 0.4 a week". */
  detail?: string;
};

type DriverBarsProps = {
  /** What the drivers explain, for assistive technology: "Drivers of failure risk". */
  label: string;
  drivers: readonly Driver[];
  unit?: string;
  decimals?: number;
  /** Which direction is bad news and gets the warning colour. */
  bad?: 'up' | 'down';
  className?: string;
};

/**
 * Why a model predicts what it does: each driver as a bar growing left or right from a centre
 * line by how much it moves the prediction, largest first, with the signed figure written out.
 */
export function DriverBars({ label, drivers, unit = '', decimals = 0, bad = 'up', className }: DriverBarsProps) {
  const look = useLook();
  const sorted = [...drivers].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const largest = Math.max(...sorted.map((driver) => Math.abs(driver.impact)), Number.EPSILON);
  const square = look === 'console' || look === 'poster' || look === 'blueprint';

  return (
    <ul aria-label={label} data-look={look} className={cx('flex min-w-0 flex-col gap-3 text-(--kit-text)', className)}>
      {sorted.map((driver) => {
        const up = driver.impact >= 0;
        const share = (Math.abs(driver.impact) / largest) * 50;
        const worse = up === (bad === 'up');
        return (
          <li key={driver.label} data-tone={worse ? 'warning' : 'success'} data-direction={up ? 'up' : 'down'} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_4.5rem] items-center gap-3">
            <div className="min-w-0">
              <div className="text-sm font-medium">{driver.label}</div>
              {driver.detail ? <div className="text-xs text-(--kit-text-3)">{driver.detail}</div> : null}
            </div>
            <div aria-hidden="true" className="relative h-4">
              <span className="absolute inset-y-0 left-1/2 border-l border-(--kit-rule-strong)" />
              <span
                className="absolute inset-y-0.5"
                style={{
                  left: up ? '50%' : `${50 - share}%`,
                  width: `${share}%`,
                  background: 'var(--t-line)',
                  borderRadius: square ? 0 : up ? '0 4px 4px 0' : '4px 0 0 4px',
                  boxShadow: look === 'poster' ? 'inset 0 0 0 1.5px var(--kit-text)' : undefined,
                }}
              />
            </div>
            <span className="text-right text-sm font-semibold tabular-nums" style={{ color: 'var(--t-ink)' }}>
              {up ? '+' : '−'}
              {formatNumber(Math.abs(driver.impact), decimals)}
              {unit}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
