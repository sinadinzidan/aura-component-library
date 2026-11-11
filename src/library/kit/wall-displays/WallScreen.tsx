import type { ReactNode } from 'react';

import { useLook } from '../../looks/useLook';
import { Canvas } from '../Canvas';
import { cx } from '../tones';

type WallScreenProps = {
  /** Where the screen hangs or what it covers: "Control room 1". */
  site: string;
  /** What this screen shows: "Plant status". */
  title: string;
  /** The wall clock, already formatted: "14:00". */
  clock: string;
  /** Next to the clock: the shift, the date. */
  meta?: string;
  /** The plant's state at the end of the header, usually a large `StatusPill`. */
  status?: ReactNode;
  /** A strip along the bottom, usually a `Ticker`. */
  footer?: ReactNode;
  /** `none` when the content runs to the edge of the glass, as console panels do. */
  padding?: 'look' | 'none';
  className?: string;
  children: ReactNode;
};

/**
 * A wall-mounted display: a dark bezel, a header that can be read from across the room — where,
 * what, and the time — the content on the look's canvas, and an optional message strip.
 */
export function WallScreen({ site, title, clock, meta, status, footer, padding = 'look', className, children }: WallScreenProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  return (
    <div data-look={look} className={cx('kit-scope flex min-w-0 flex-col bg-(--mountain-900) p-2.5', square ? 'rounded-md' : 'rounded-2xl', className)}>
      <div className={cx('flex min-w-0 flex-1 flex-col overflow-hidden', square ? 'rounded-sm' : 'rounded-lg')} style={{ background: look === 'glass' ? 'var(--kit-canvas-bg)' : 'var(--kit-surface)' }}>
        <header className="flex items-center gap-6 px-6 py-4 text-(--kit-text)" style={{ borderBottom: look === 'poster' ? '2px solid var(--kit-text)' : '1px solid var(--kit-rule)' }}>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-medium text-(--kit-text-2)">{site}</span>
            <h3 className="text-2xl leading-8 font-semibold tracking-tight">{title}</h3>
          </div>
          {status ? <div className="flex items-center gap-3">{status}</div> : null}
          <div className="ml-auto flex items-baseline gap-4 whitespace-nowrap">
            {meta ? <span className="text-base font-medium text-(--kit-text-2)">{meta}</span> : null}
            <time className="text-4xl leading-none font-semibold tabular-nums" style={{ letterSpacing: 'var(--kit-figure-tracking)' }}>
              {clock}
            </time>
          </div>
        </header>
        <Canvas padding={padding} className="flex flex-1 flex-col">
          {children}
        </Canvas>
        {footer}
      </div>
    </div>
  );
}
