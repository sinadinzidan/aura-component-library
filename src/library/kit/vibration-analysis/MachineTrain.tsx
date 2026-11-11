import { useLook } from '../../looks/useLook';
import { cx, formatNumber, type Tone } from '../tones';

/** A machine on the shaft: where it starts and ends along the train, 0–1. */
export type TrainMachine = { id: string; label: string; detail?: string; from: number; to: number };

/** A measurement point on a bearing, placed along the train, 0–1. */
export type TrainPoint = { id: string; label: string; at: number; value: number; tone: Tone; state: string };

type MachineTrainProps = {
  /** Accessible name: "Export pump A measurement points". */
  label: string;
  machines: readonly TrainMachine[];
  points: readonly TrainPoint[];
  unit?: string;
  selected?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

/**
 * A machine train drawn from the side — driver, coupling, driven machine on one shaft — with a
 * reading at every bearing. Points are buttons: picking one is how the analyst chooses which
 * spectrum to look at.
 */
export function MachineTrain({ label, machines, points, unit = 'mm/s', selected, onSelect, className }: MachineTrainProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  const filled = look === 'signal' || look === 'poster';

  return (
    <div role="group" aria-label={label} data-look={look} className={cx('flex min-w-0 flex-col', className)}>
      <div className="relative h-19">
        {points.map((point) => {
          const active = point.id === selected;
          return (
            <button
              key={point.id}
              type="button"
              data-tone={point.tone}
              aria-pressed={onSelect ? active : undefined}
              aria-label={`${point.label}: ${formatNumber(point.value, 1)} ${unit}, ${point.state}`}
              onClick={() => onSelect?.(point.id)}
              className={cx(
                'absolute top-0 flex w-30 -translate-x-1/2 cursor-pointer flex-col items-start gap-0.5 px-3 py-2 text-left outline-none transition-colors focus-visible:[box-shadow:0_0_0_2px_var(--kit-accent)]',
                square ? '' : 'rounded-(--kit-radius-sm)',
                filled ? 'bg-(--t-solid) text-(--t-on-solid)' : 'bg-(--kit-surface) text-(--kit-text) [border:1px_solid_var(--kit-rule)]',
                active ? '[box-shadow:0_0_0_2px_var(--kit-text)]' : ''
              )}
              style={{ left: `${point.at * 100}%`, borderTop: filled ? undefined : '3px solid var(--t-line)' }}
            >
              <span className="text-xs font-medium whitespace-nowrap">{point.label}</span>
              <span className="text-base leading-5 font-semibold tabular-nums">
                {formatNumber(point.value, 1)}
                <span className={cx('ml-1 text-xs font-medium', filled ? '' : 'text-(--t-ink)')}>{point.state}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div aria-hidden="true" className="relative h-6">
        {points.map((point) => (
          <span key={point.id} data-tone={point.tone} className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-(--t-line)" style={{ left: `${point.at * 100}%` }} />
        ))}
      </div>
      <div aria-hidden="true" className="relative h-24">
        <span className="absolute top-1/2 right-0 left-0 h-2.5 -translate-y-1/2 bg-(--kit-rule-strong)" />
        {machines.map((machine) => (
          <span
            key={machine.id}
            className={cx('absolute top-0 bottom-0 flex flex-col items-center justify-center gap-0.5 bg-(--kit-well) px-2 text-center [border:1.5px_solid_var(--kit-rule-strong)]', square ? '' : 'rounded-(--kit-radius-sm)')}
            style={{ left: `${machine.from * 100}%`, width: `${(machine.to - machine.from) * 100}%` }}
          >
            <span className="text-sm font-semibold text-(--kit-text)">{machine.label}</span>
            {machine.detail ? <span className="text-xs text-(--kit-text-2)">{machine.detail}</span> : null}
          </span>
        ))}
        {points.map((point) => (
          <span key={point.id} data-tone={point.tone} className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--t-line) [box-shadow:0_0_0_3px_var(--kit-surface)]" style={{ left: `${point.at * 100}%` }} />
        ))}
      </div>
    </div>
  );
}
