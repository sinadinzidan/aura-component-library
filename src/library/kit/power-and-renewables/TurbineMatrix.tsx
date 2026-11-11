import { useLook } from '../../looks/useLook';
import { BLOCK_ANATOMY, blockStyle } from '../process-flow/anatomy';
import { cx, formatNumber } from '../tones';

import { TURBINE_TONE, TURBINE_WORD, type TurbineState } from './power';

export type MatrixTurbine = { name: string; state: TurbineState; power: number | null };

type TurbineMatrixProps = {
  /** What the grid is: "Nordkapp wind farm, 12 turbines". */
  label: string;
  turbines: readonly MatrixTurbine[];
  ratedPower: number;
  columns?: number;
  selected?: string | null;
  onSelect?: (name: string) => void;
  className?: string;
};

/**
 * A wind farm as a grid of cells, one per turbine, in the order they stand. A generating turbine
 * is calm; one that is not carries its state as a word and its tone, so the exceptions stand out.
 * In poster and signal every cell is filled with its state.
 */
export function TurbineMatrix({ label, turbines, ratedPower, columns = 4, selected = null, onSelect, className }: TurbineMatrixProps) {
  const look = useLook();
  const anatomy = BLOCK_ANATOMY[look];
  const solid = anatomy === 'solid';

  return (
    <ul data-look={look} aria-label={label} className={cx('grid w-full min-w-0', className)} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: solid || anatomy === 'strip' ? 6 : 10 }}>
      {turbines.map((turbine) => {
        const calm = turbine.state === 'generating';
        const share = turbine.power === null ? 0 : Math.max(0, Math.min(1, turbine.power / ratedPower));
        const style = {
          ...blockStyle(look),
          ...(anatomy === 'card' && !calm ? { background: 'var(--t-soft)', borderColor: 'color-mix(in oklab, var(--t-line) 45%, transparent)' } : {}),
          boxShadow: anatomy === 'strip' ? 'inset 4px 0 0 var(--t-line), 0 0 0 1px var(--kit-rule)' : anatomy === 'solid' && look === 'poster' ? '3px 3px 0 var(--base-foreground)' : 'none',
          outline: turbine.name === selected ? '2px solid var(--kit-accent)' : undefined,
          outlineOffset: turbine.name === selected ? 2 : undefined,
        };
        const body = (
          <>
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold whitespace-nowrap text-(--kit-text) tabular-nums">{turbine.name}</span>
              <span className="text-sm whitespace-nowrap text-(--kit-text) tabular-nums" style={{ fontWeight: 'var(--kit-figure-weight)' }}>
                {turbine.power === null ? '—' : formatNumber(turbine.power, 1)}
                <span className="ml-1 text-xs font-medium text-(--kit-text-3)">MW</span>
              </span>
            </span>
            <span className="block overflow-hidden" style={{ height: 6, borderRadius: 'var(--kit-track-radius)', background: 'var(--kit-track)', boxShadow: look === 'blueprint' ? 'inset 0 0 0 1px var(--kit-rule-strong)' : undefined }}>
              <span className="block h-full" style={{ width: `${share * 100}%`, background: solid ? 'currentColor' : 'var(--t-line)' }} />
            </span>
            <span className="text-xs font-semibold" style={{ color: solid ? 'currentColor' : calm ? 'var(--kit-text-3)' : 'var(--t-ink)' }}>
              {TURBINE_WORD[turbine.state]}
            </span>
          </>
        );
        const box = cx('flex h-full w-full min-w-0 flex-col gap-2 p-3 text-left', anatomy === 'rule' && 'px-0');
        return (
          <li key={turbine.name} data-state={turbine.state} className="min-w-0">
            {onSelect ? (
              <button type="button" data-tone={TURBINE_TONE[turbine.state]} aria-pressed={turbine.name === selected} aria-label={`${turbine.name}, ${TURBINE_WORD[turbine.state].toLowerCase()}`} onClick={() => onSelect(turbine.name)} className={cx(box, 'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring-default')} style={style}>
                {body}
              </button>
            ) : (
              <div data-tone={TURBINE_TONE[turbine.state]} className={box} style={style}>
                {body}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
