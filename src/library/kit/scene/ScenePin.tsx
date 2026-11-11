import { Html } from '@react-three/drei';

import { toTuple } from '../../three/cameraTargets';
import type { Vec3 } from '../../three/cameraTargets';
import { cx } from '../tones';
import type { StatusTone } from '../tones';

export type ScenePinProps = {
  /** The measured point, in scene coordinates. */
  position: Vec3;
  /** What is measured: "Discharge pressure". */
  label: string;
  /** The reading, already formatted, without its unit. */
  value: string;
  unit?: string;
  /** The judgement in a word, shown when the reading is not normal: "High", "In alarm". */
  state?: string;
  tone?: StatusTone;
  /** Where the card sits relative to the point, in px. The leader line joins the two. */
  offset?: readonly [number, number];
  selected?: boolean;
  /** Quieter card, for readouts on parts that are ghosted. */
  dimmed?: boolean;
  /** Makes the card a button. Pointer only: offer the same readings as buttons outside the canvas. */
  onSelect?: () => void;
};

/**
 * A live reading pinned to a point on a 3D model: a dot on the spot, a leader line, and a card
 * with the name, the value in large tabular figures and, when it is not normal, the state in a
 * word. It is HTML set in the UI sans, so it stays sharp and readable at any zoom. Hidden from
 * assistive technology — the canvas is one image; list the same readings beside it.
 */
export function ScenePin({ position, label, value, unit, state, tone = 'neutral', offset = [56, -40], selected = false, dimmed = false, onSelect }: ScenePinProps) {
  const [dx, dy] = offset;
  const abnormal = tone !== 'neutral';
  const card = cx(
    'pointer-events-auto absolute flex min-w-28 flex-col gap-0.5 whitespace-nowrap rounded-xl border px-3 py-2 text-left font-sans backdrop-blur-md',
    'bg-[color-mix(in_oklab,var(--card-background)_80%,transparent)] shadow-[0_10px_24px_-12px_var(--opacity-black-60)]',
    selected ? 'border-[var(--primary-background)] shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary-background)_30%,transparent)]' : abnormal ? 'border-[color:var(--t-line)]' : 'border-emphasized',
    onSelect && 'cursor-pointer hover:border-[var(--primary-background)]',
    dimmed && !selected && 'opacity-50'
  );
  const body = (
    <>
      <span className="text-xs font-medium leading-4 text-medium-foreground">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className={cx('text-lg font-semibold leading-6 tabular-nums', abnormal ? 'text-[color:var(--t-line)]' : 'text-base-foreground')}>{value}</span>
        {unit ? <span className="text-xs text-medium-foreground">{unit}</span> : null}
      </span>
      {state ? <span className={cx('text-xs font-semibold leading-4', abnormal ? 'text-[color:var(--t-line)]' : 'text-medium-foreground')}>{state}</span> : null}
    </>
  );
  const place = { left: dx, top: dy, transform: `translate(${dx < 0 ? '-100%' : '0'}, -50%)` };

  return (
    <Html position={toTuple(position)} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div data-slot="scene-pin" data-tone={tone} data-selected={selected || undefined} aria-hidden="true" className="relative size-0">
        <svg className="absolute left-0 top-0 overflow-visible" width="1" height="1">
          <line x1={0} y1={0} x2={dx} y2={dy} strokeWidth={1.5} className={abnormal ? 'stroke-[color:var(--t-line)]' : 'stroke-[color:var(--muted-foreground)]'} />
        </svg>
        <span
          className={cx(
            'absolute -left-1.5 -top-1.5 size-3 rounded-full border-2 border-[color:var(--card-background)]',
            abnormal ? 'bg-[var(--t-line)]' : 'bg-[var(--primary-background)]'
          )}
        />
        {onSelect ? (
          <button type="button" tabIndex={-1} onClick={onSelect} className={card} style={place}>
            {body}
          </button>
        ) : (
          <div className={card} style={place}>
            {body}
          </div>
        )}
      </div>
    </Html>
  );
}
