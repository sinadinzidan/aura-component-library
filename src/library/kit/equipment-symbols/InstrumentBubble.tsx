import { useLook } from '../../looks/useLook';
import { cx, type Tone } from '../tones';

export type BubbleMounting = 'field' | 'panel' | 'dcs';

const MOUNTING_WORDS: Record<BubbleMounting, string> = { field: 'field mounted', panel: 'on the control panel', dcs: 'in the control system' };

type InstrumentBubbleProps = {
  /** Function letters after ISA 5.1: "PT", "TIC", "LAH". */
  letters: string;
  /** Loop number under the letters. */
  loop: string;
  /** Where the instrument lives: a plain circle in the field, a line through it on the panel, a square around it in the control system. */
  mounting?: BubbleMounting;
  /** State of the measurement; `neutral` draws in ink. */
  tone?: Tone;
  /** Diameter in px. */
  size?: number;
  className?: string;
};

/**
 * An instrument bubble: function letters over the loop number, with the mounting told by the
 * frame. It carries a state by taking its tone, tinted or outlined as the look draws symbols.
 */
export function InstrumentBubble({ letters, loop, mounting = 'field', tone = 'neutral', size = 64, className }: InstrumentBubbleProps) {
  const look = useLook();
  const ink = tone === 'neutral' ? 'var(--kit-text)' : 'var(--t-line)';
  const lineOnly = look === 'blueprint' || look === 'editorial';
  const fill = tone === 'neutral' || lineOnly ? 'var(--kit-halo)' : 'color-mix(in oklab, var(--t-line) 18%, var(--kit-halo))';
  const weight = look === 'poster' ? 2.5 : lineOnly ? 1.25 : 1.75;
  const half = size / 2;
  const radius = half - weight;

  return (
    <svg
      role="img"
      aria-label={`${letters} ${loop}, ${MOUNTING_WORDS[mounting]}`}
      data-look={look}
      data-tone={tone}
      data-mounting={mounting}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cx('shrink-0', className)}
      fill="none"
      stroke={ink}
      strokeWidth={weight}
    >
      {mounting === 'dcs' ? <rect x={weight / 2} y={weight / 2} width={size - weight} height={size - weight} fill="var(--kit-halo)" /> : null}
      <circle cx={half} cy={half} r={radius} fill={fill} />
      {mounting === 'field' ? null : <path d={`M${half - radius} ${half}H${half + radius}`} />}
      <g stroke="none" fill="var(--kit-text)" textAnchor="middle" fontWeight={600} className="tabular-nums">
        <text x={half} y={half - 5} fontSize={Math.max(12, size * 0.22)}>
          {letters}
        </text>
        <text x={half} y={half + 15} fontSize={12} fontWeight={500}>
          {loop}
        </text>
      </g>
    </svg>
  );
}
