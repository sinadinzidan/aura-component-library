import { cx } from '../tones';

export type DepthStop<Id extends string> = {
  id: Id;
  /** Name of the level: "Water column". */
  label: string;
  /** Depth below the surface in metres. */
  metres: number;
  /** What lives there: "Risers and moorings". */
  hint: string;
};

type DepthRailProps<Id extends string> = {
  /** Accessible name of the control: "Camera depth". */
  label: string;
  /** Shallowest first. */
  stops: readonly DepthStop<Id>[];
  value: Id;
  onChange: (id: Id) => void;
  className?: string;
};

/**
 * A vertical depth gauge that doubles as the camera control of a subsea scene: the stops sit on a
 * line from the surface down to the seabed, each with its depth in metres, and the active one
 * glows. It fills the height it is given, so the spacing reads as a scale.
 */
export function DepthRail<Id extends string>({ label, stops, value, onChange, className }: DepthRailProps<Id>) {
  return (
    <nav aria-label={label} data-slot="depth-rail" className={cx('flex min-h-0 flex-col', className)}>
      <ol className="relative flex min-h-0 flex-1 flex-col justify-between">
        <span aria-hidden="true" className="absolute bottom-3 left-[0.6875rem] top-3 w-0.5 rounded-full bg-[linear-gradient(to_bottom,var(--kit-line-sky),var(--kit-line-blue),var(--kit-line-purple))] opacity-60" />
        {stops.map((stop) => {
          const active = stop.id === value;
          return (
            <li key={stop.id} className="relative">
              <button
                type="button"
                aria-pressed={active}
                aria-label={`${stop.label}, ${stop.metres} metres: ${stop.hint}`}
                onClick={() => onChange(stop.id)}
                className="group flex w-full cursor-pointer items-start gap-3 rounded-[var(--kit-radius-sm)] py-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-default)]"
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    'relative z-10 mt-0.5 size-6 shrink-0 rounded-full border-2 transition-colors',
                    active ? 'border-[var(--kit-accent)] bg-[var(--kit-accent)] shadow-[0_0_18px_var(--kit-accent)]' : 'border-[var(--kit-rule-strong)] bg-[var(--kit-halo)] group-hover:border-[var(--kit-accent)]'
                  )}
                />
                <span className="flex min-w-0 flex-col">
                  <span className={cx('text-sm', active ? 'font-semibold text-[var(--kit-text)]' : 'text-[var(--kit-text-2)]')}>{stop.label}</span>
                  <span className={cx('text-lg font-semibold tabular-nums leading-6', active ? 'text-[var(--kit-text)]' : 'text-[var(--kit-text-2)]')}>{stop.metres} m</span>
                  <span className="text-xs text-[var(--kit-text-3)]">{stop.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
