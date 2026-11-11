import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type StackLamp = { id: string; label: string; tone: Tone };

type StackLightProps = {
  /** The machine the light belongs to. */
  label: string;
  /** Lamps from top to bottom, as on a physical signal tower. */
  lamps: readonly StackLamp[];
  /** Id of the lamp that is lit. */
  lit: string;
  orientation?: 'vertical' | 'horizontal';
  /** Hide the caption under the tower when a heading next to it already names the machine. */
  hideCaption?: boolean;
  className?: string;
};

/**
 * A signal tower: stacked lamps of which one is lit. The position of the lit lamp says the state
 * as much as its colour does, and the lit state is written underneath.
 */
export function StackLight({ label, lamps, lit, orientation = 'vertical', hideCaption = false, className }: StackLightProps) {
  const look = useLook();
  const active = lamps.find((lamp) => lamp.id === lit);
  const vertical = orientation === 'vertical';
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  return (
    <div role="img" aria-label={`${label}: ${active ? active.label : 'off'}`} data-look={look} data-orientation={orientation} className={cx('inline-flex min-w-0 items-center gap-2', vertical ? 'flex-col' : 'flex-row', className)}>
      <span className={cx('flex gap-1 p-1', vertical ? 'flex-col' : 'flex-row')} style={{ background: 'color-mix(in oklab, var(--kit-text) 8%, transparent)', borderRadius: square ? 0 : 10, border: '1px solid var(--kit-rule)' }}>
        {lamps.map((lamp) => {
          const on = lamp.id === lit;
          return (
            <span
              key={lamp.id}
              data-tone={lamp.tone}
              data-lit={on}
              className={vertical ? 'h-5 w-9' : 'h-7 w-7'}
              style={{
                background: on ? 'var(--t-line)' : 'color-mix(in oklab, var(--t-line) 16%, var(--kit-surface))',
                borderRadius: square ? 0 : 6,
                boxShadow: on && look === 'glass' ? '0 0 12px var(--t-line)' : on ? 'inset 0 0 0 1px color-mix(in oklab, var(--kit-text) 20%, transparent)' : undefined,
              }}
            />
          );
        })}
      </span>
      {hideCaption ? null : (
        <span className={cx('flex min-w-0 flex-col', vertical ? 'items-center text-center' : '')}>
          <span className="text-sm font-medium text-(--kit-text)">{label}</span>
          <span className="text-xs text-(--kit-text-2)">{active ? active.label : 'Off'}</span>
        </span>
      )}
    </div>
  );
}
