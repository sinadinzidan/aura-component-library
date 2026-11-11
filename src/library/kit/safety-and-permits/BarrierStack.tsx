import { useLook } from '../../looks/useLook';
import { StatusPill } from '../StatusPill';
import { cx, type Tone } from '../tones';

export type Barrier = {
  id: string;
  name: string;
  /** What the barrier does, e.g. `Prevent`, `Detect`, `Control`, `Mitigate`. */
  role: string;
  /** Safety-critical elements behind the barrier, by test result. */
  passed: number;
  degraded: number;
  failed: number;
};

type BarrierStackProps = {
  label: string;
  barriers: readonly Barrier[];
  className?: string;
};

type BarrierState = { tone: Tone; word: string };

/** A barrier is only as good as its worst element. */
export function barrierState(barrier: Barrier): BarrierState {
  if (barrier.failed > 0) return { tone: 'critical', word: 'Impaired' };
  if (barrier.degraded > 0) return { tone: 'warning', word: 'Degraded' };
  return { tone: 'success', word: 'Healthy' };
}

/**
 * Barriers between a hazard and its consequence, one row each: the role, the name, one block per
 * safety-critical element coloured by its last test, and the state of the barrier as a word.
 * Reads top to bottom in the order the barriers act.
 */
export function BarrierStack({ label, barriers, className }: BarrierStackProps) {
  const look = useLook();
  const square = look === 'console' || look === 'poster' || look === 'blueprint';
  return (
    <ul aria-label={label} data-look={look} className={cx('flex min-w-0 flex-col', className)}>
      {barriers.map((barrier, index) => {
        const state = barrierState(barrier);
        const blocks: Tone[] = [
          ...Array.from({ length: barrier.passed }, (): Tone => 'success'),
          ...Array.from({ length: barrier.degraded }, (): Tone => 'warning'),
          ...Array.from({ length: barrier.failed }, (): Tone => 'critical'),
        ];
        return (
          <li key={barrier.id} data-tone={state.tone} className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1.5fr)_auto] items-center gap-4 py-3" style={{ borderTop: index === 0 ? undefined : '1px solid var(--kit-rule)' }}>
            <div className="min-w-0">
              <p className="text-xs font-medium text-(--kit-text-3)">{barrier.role}</p>
              <p className="text-sm font-semibold text-(--kit-text)">{barrier.name}</p>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex h-5 gap-[3px]" role="img" aria-label={`${barrier.passed} passed, ${barrier.degraded} degraded, ${barrier.failed} failed`}>
                {blocks.map((tone, block) => (
                  <span key={block} data-tone={tone} className="min-w-0 flex-1" style={{ background: 'var(--t-line)', borderRadius: square ? 0 : 3 }} />
                ))}
              </div>
              <p className="text-xs text-(--kit-text-3) tabular-nums">
                {barrier.passed} of {blocks.length} elements passed
              </p>
            </div>
            <StatusPill tone={state.tone}>{state.word}</StatusPill>
          </li>
        );
      })}
    </ul>
  );
}
