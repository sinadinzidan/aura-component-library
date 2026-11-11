import { useLook } from '../../looks/useLook';
import { BLOCK_ANATOMY, FIGURE_STYLE, blockStyle } from '../process-flow/anatomy';
import { StatusPill } from '../StatusPill';
import { TagId } from '../TagId';
import { cx, formatNumber } from '../tones';

import { TURBINE_TONE, TURBINE_WORD, type TurbineState } from './power';
import { RotorGlyph } from './RotorGlyph';

type TurbineTileProps = {
  name: string;
  state: TurbineState;
  /** Active power in MW. `null` when there is no reading. */
  power: number | null;
  ratedPower: number;
  /** Wind speed at the nacelle, m/s. */
  windSpeed?: number | null;
  /** Rotor speed, rpm. */
  rotorSpeed?: number | null;
  /** Why it is not generating, in words. */
  detail?: string;
  className?: string;
};

/**
 * One wind turbine: what it is doing in a word, its power against its rating, and the wind it
 * sees. A turbine that is not generating says why. The block follows the look — a card with a
 * pill, a state-edged block in console, a tile filled with its state in poster and signal.
 */
export function TurbineTile({ name, state, power, ratedPower, windSpeed, rotorSpeed, detail, className }: TurbineTileProps) {
  const look = useLook();
  const anatomy = BLOCK_ANATOMY[look];
  const solid = anatomy === 'solid';
  const tone = TURBINE_TONE[state];
  const share = power === null ? 0 : Math.max(0, Math.min(1, power / ratedPower));
  const turning = state === 'generating' || state === 'curtailed';
  const fact = (label: string, value: number | null | undefined, unit: string) => (
    <div className="flex min-w-0 flex-col">
      <dt className="text-xs text-(--kit-text-3)">{label}</dt>
      <dd className="text-sm font-semibold text-(--kit-text) tabular-nums">{value === null || value === undefined ? '—' : `${formatNumber(value, 1)} ${unit}`}</dd>
    </div>
  );

  return (
    <article data-look={look} data-tone={tone} data-state={state} aria-label={`${name}, ${TURBINE_WORD[state].toLowerCase()}`} className={cx('flex h-full min-w-0 flex-col gap-3 p-4', anatomy === 'rule' && 'px-0', className)} style={blockStyle(look)}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <TagId className="text-base font-semibold">{name}</TagId>
          {solid ? <span className="text-xl font-extrabold text-(--kit-text)">{TURBINE_WORD[state]}</span> : <StatusPill tone={tone}>{TURBINE_WORD[state]}</StatusPill>}
        </div>
        <span style={{ color: solid ? 'currentColor' : turning ? 'var(--t-line)' : 'var(--kit-text-3)' }}>
          <RotorGlyph size={60} angle={turning ? 22 : 0} feathered={!turning} />
        </span>
      </header>
      <div className="flex flex-col gap-1.5">
        <p className="flex items-baseline gap-1.5 text-(--kit-text) tabular-nums">
          <span style={{ ...FIGURE_STYLE, fontSize: '1.75rem' }}>{power === null ? '—' : formatNumber(power, 1)}</span>
          <span className="text-xs font-medium text-(--kit-text-3)">of {formatNumber(ratedPower, 1)} MW</span>
        </p>
        <div role="meter" aria-label={`${name} power against rating`} aria-valuemin={0} aria-valuemax={ratedPower} aria-valuenow={power ?? 0} className="overflow-hidden" style={{ height: 'var(--kit-track-h)', borderRadius: 'var(--kit-track-radius)', background: 'var(--kit-track)', boxShadow: look === 'blueprint' ? 'inset 0 0 0 1px var(--kit-rule-strong)' : undefined }}>
          <div style={{ width: `${share * 100}%`, height: '100%', background: solid ? 'currentColor' : 'var(--t-line)' }} />
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        {fact('Wind', windSpeed, 'm/s')}
        {fact('Rotor', rotorSpeed, 'rpm')}
      </dl>
      {detail ? <p className="mt-auto border-t border-(--kit-rule) pt-2.5 text-xs font-medium text-(--kit-text-2)">{detail}</p> : null}
    </article>
  );
}
